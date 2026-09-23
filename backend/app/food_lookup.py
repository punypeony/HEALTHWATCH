"""Open Food Facts lookup, strict per-100g normalization and PostgreSQL cache."""
import json
import os
import re
from decimal import Decimal, DecimalException, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

import httpx
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import database
from app.errors import ApiError
from app.models import ScannedProduct

API_URL = 'https://world.openfoodfacts.org/api/v2/product/{barcode}.json'
TIMEOUT_SECONDS = 10
DEMO_PATH = Path(__file__).resolve().parents[1] / 'demo_products.json'
USER_AGENT = 'FoodConsumptionHealthMonitor/0.1 (student project)'


def validate_barcode(barcode: str) -> str:
    if not isinstance(barcode, str) or not re.fullmatch(r'[0-9]{8,14}', barcode):
        raise ApiError(422, 'VALIDATION_ERROR', 'Barcode must contain 8 to 14 digits.')
    return barcode


def nutrition_number(value) -> Decimal:
    """Missing, negative, boolean and non-finite values are not nutrition data."""
    try:
        number = Decimal(str(value))
        if isinstance(value, bool) or not number.is_finite() or number < 0:
            raise ValueError
        return number
    except (InvalidOperation, ValueError):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Product nutrition values are missing or invalid.') from None


def serving_grams(product: dict) -> Decimal:
    """Accept an explicit gram mass, optionally following a count/portion label.

    Never infer grams from ml, a bare serving_quantity, cups or an item count.
    """
    label = product.get('serving_size')
    if not isinstance(label, str):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Serving size must specify a reliable mass in grams.')
    mass = r'([0-9]+(?:\.[0-9]+)?)\s*g'
    match = re.fullmatch(r'\s*' + mass + r'\s*', label, re.IGNORECASE)
    if match is None:
        match = re.fullmatch(r'[^()]+\(\s*' + mass + r'\s*\)\s*', label, re.IGNORECASE)
    if not match:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Serving size must specify a reliable mass in grams.')
    grams = nutrition_number(match.group(1))
    if grams == 0:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Serving size must be greater than zero.')
    return grams


def nutrient_per_100g(product: dict, nutrient: str) -> Decimal:
    nutrients = product['nutriments']
    # OFF normalized nutrient keys are grams (energy-kcal is kcal, energy is kJ),
    # regardless of the label-entry *_unit. See OFF explain-product-json docs.
    key = nutrient + '_100g'
    if key in nutrients and nutrients[key] is not None:
        return nutrition_number(nutrients[key])
    value = nutrition_number(nutrients.get(nutrient + '_serving'))
    try:
        return value * 100 / serving_grams(product)
    except DecimalException as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Nutrition conversion is outside the supported range.') from exc


def normalize_product(barcode: str, payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Food service returned an invalid product response.')
    try:
        # JSONB cannot store NaN/infinity or NUL characters, even in unused fields.
        serialized = json.dumps(payload, allow_nan=False)
        if '\\u0000' in serialized:
            raise ValueError
    except (ValueError, TypeError) as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Food service returned invalid JSON data.') from exc
    if payload.get('status') == 0:
        raise ApiError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.')
    product = payload.get('product')
    if payload.get('status') != 1 or not isinstance(product, dict) or not isinstance(product.get('nutriments'), dict):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Food service returned an invalid product response.')
    name = product.get('product_name') or product.get('product_name_en')
    if not isinstance(name, str) or not name.strip() or '\x00' in name:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Product name is missing or invalid.')
    # Do not assume a liquid density of 1g/ml. Ambiguous volume-based entries
    # need a separate density-aware implementation before they can be used.
    if (product.get('nutrition_data_per') in ('100ml', '100 ml')
            or re.search(r'\bml\b', str(product.get('serving_size', '')), re.IGNORECASE)):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Volume-based nutrition cannot be converted to grams reliably.')
    nutrients = product['nutriments']
    # Prefer per-100g kJ over per-serving kcal when only the former is available.
    energy_key = next((key for key, suffix in (
        ('energy-kcal', '_100g'), ('energy', '_100g'),
        ('energy-kcal', '_serving'), ('energy', '_serving')
    ) if nutrients.get(key + suffix) is not None), 'energy-kcal')
    calories = nutrient_per_100g(product, energy_key)
    if energy_key == 'energy':
        calories /= Decimal('4.184')
    sodium = nutrient_per_100g(product, 'sodium')
    if sodium > Decimal('99999.99999'):
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Sodium exceeds supported storage range.')
    values = {'calories': calories, 'sodium_mg': sodium * 1000,
              'sugar_g': nutrient_per_100g(product, 'sugars')}
    for key, value in values.items():
        if value > Decimal('99999999.99'):
            raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Nutrition value exceeds supported storage range.')
        values[key] = value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return {'barcode': barcode, 'name': name.strip(), **values, 'raw_response': payload}


def request_product(barcode: str) -> dict:
    try:
        response = httpx.get(API_URL.format(barcode=barcode), timeout=TIMEOUT_SECONDS,
                             headers={'User-Agent': USER_AGENT})
        if response.status_code == 404:
            raise ApiError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.')
        response.raise_for_status()
        return response.json()
    except httpx.TimeoutException as exc:
        raise ApiError(504, 'FOOD_LOOKUP_TIMEOUT', 'Food lookup timed out.') from exc
    except httpx.HTTPError as exc:
        raise ApiError(502, 'FOOD_LOOKUP_FAILED', 'Food service is unavailable.') from exc
    except ValueError as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Food service returned invalid JSON.') from exc


def read_demo_product(barcode: str) -> dict:
    try:
        products = json.loads(DEMO_PATH.read_text(encoding='utf-8'))
        if not isinstance(products, dict):
            raise ValueError
    except (OSError, ValueError) as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Demo product data could not be loaded.') from exc
    if barcode not in products:
        raise ApiError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.')
    return normalize_product(barcode, products[barcode])


def cached_product_dict(product: ScannedProduct) -> dict:
    return {field: getattr(product, field) for field in
            ('barcode', 'name', 'calories', 'sodium_mg', 'sugar_g', 'raw_response')}


def fetch_product(barcode: str) -> dict:
    """Return canonical nutrition; demo mode never touches the real cache/network.

    A short independent cache transaction commits only the successful product.
    Scan transactions use its barcode to reference the cached row.
    """
    barcode = validate_barcode(barcode)
    if os.getenv('DEMO_MODE', 'false').strip().lower() == 'true':
        return read_demo_product(barcode)
    try:
        with Session(database.engine) as session:
            cached = session.scalar(select(ScannedProduct).where(ScannedProduct.barcode == barcode))
            if cached is not None:
                return cached_product_dict(cached)
        product = normalize_product(barcode, request_product(barcode))
        with Session(database.engine) as session:
            # Concurrent successful requests share the unique barcode row.
            session.execute(insert(ScannedProduct).values(**product).on_conflict_do_nothing(index_elements=['barcode']))
            session.commit()
            cached = session.scalar(select(ScannedProduct).where(ScannedProduct.barcode == barcode))
            return cached_product_dict(cached)
    except SQLAlchemyError as exc:
        raise ApiError(503, 'DATABASE_ERROR', 'Product cache is unavailable.') from exc
