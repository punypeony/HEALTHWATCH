"""Local FNRI dish rows. A typed name never calls Open Food Facts."""
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

from app.errors import ApiError
from app.food_lookup import normalize_product

DISH_PATH = Path(__file__).resolve().parents[1] / 'dishes.json'


def resolve_dish(name: str) -> dict:
    """Return one saved dish in the same shape as a normalized barcode product.

    Sodium in the Open Food Facts-shaped payload is grams per 100 g.
    A missing saturated-fat value is omitted rather than stored as zero.
    """
    key = name.strip().lower()
    try:
        dishes = json.loads(DISH_PATH.read_text(encoding='utf-8'))
        if not isinstance(dishes, dict):
            raise ValueError
    except (OSError, ValueError) as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Dish data could not be loaded.') from exc
    row = dishes.get(key)
    if not isinstance(row, dict):
        raise ApiError(404, 'PRODUCT_NOT_FOUND', 'Product was not found.')
    try:
        sodium_g = Decimal(str(row['sodium_mg'])) / Decimal('1000')
        nutriments = {
            'energy-kcal_100g': row['calories'],
            'sodium_100g': json.loads(format(sodium_g, 'f')),
            'sugars_100g': row['sugar_g'],
            'fat_100g': row['fat_g'],
        }
        if row.get('saturated_fat_g') is not None:
            nutriments['saturated-fat_100g'] = row['saturated_fat_g']
        dish_name = row['name']
        if not isinstance(dish_name, str) or not dish_name.strip():
            raise ValueError
    except (KeyError, InvalidOperation, TypeError, ValueError) as exc:
        raise ApiError(422, 'PRODUCT_DATA_INVALID', 'Dish data could not be loaded.') from exc
    payload = {
        'status': 1,
        'product': {
            'product_name': dish_name,
            'allergens_tags': [],
            'nutrition_data_per': '100g',
            'nutriments': nutriments,
        },
    }
    return normalize_product(f'dish:{key}', payload)
