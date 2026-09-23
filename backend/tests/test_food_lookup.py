from copy import deepcopy
from decimal import Decimal
from unittest.mock import Mock

import httpx
import pytest
from sqlalchemy import select, func

from app import food_lookup as lookup
from app.errors import ApiError
from app.models import ScannedProduct

BARCODE = '3017620422003'
PAYLOAD = {'status': 1, 'product': {'product_name': 'Test Food', 'allergens_tags': ['en:milk'],
           'nutriments': {'energy-kcal_100g': 250, 'sodium_100g': 0.65, 'sugars_100g': 12}}}


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    monkeypatch.setenv('DEMO_MODE', 'false')
    mock = Mock(side_effect=AssertionError('Unmocked network request'))
    monkeypatch.setattr(lookup.httpx, 'get', mock)
    return mock


@pytest.fixture
def cache(db_session, monkeypatch):
    # Independent cache sessions use savepoints on this rollback-only connection.
    connection = db_session.connection()
    real_session = lookup.Session
    monkeypatch.setattr(lookup, 'Session', lambda engine: real_session(
        bind=connection, join_transaction_mode='create_savepoint'))
    return db_session


def response(payload=PAYLOAD, status=200):
    return httpx.Response(status, json=payload, request=httpx.Request('GET', lookup.API_URL.format(barcode=BARCODE)))


def test_success_cache_and_no_repeat_network(cache, offline):
    offline.side_effect = None
    offline.return_value = response()
    result = lookup.fetch_product(BARCODE)
    assert result['calories'] == 250 and result['sodium_mg'] == 650 and result['sugar_g'] == 12
    assert result['raw_response'] == PAYLOAD
    assert lookup.fetch_product(BARCODE) == result
    offline.assert_called_once_with(lookup.API_URL.format(barcode=BARCODE), timeout=10,
                                    headers={'User-Agent': lookup.USER_AGENT})
    assert cache.scalar(select(func.count()).select_from(ScannedProduct)) == 1


def test_cache_hit(cache, offline):
    product = ScannedProduct(**lookup.normalize_product(BARCODE, PAYLOAD))
    cache.add(product)
    cache.flush()
    assert lookup.cached_product_dict(product) == lookup.fetch_product(BARCODE)
    offline.assert_not_called()


@pytest.mark.parametrize('reply,code,status', [
    (response({'status': 0}), 'PRODUCT_NOT_FOUND', 404),
    (response({}, 404), 'PRODUCT_NOT_FOUND', 404),
    (response({}, 503), 'FOOD_LOOKUP_FAILED', 502),
    (response([]), 'PRODUCT_DATA_INVALID', 422),
    (response({'status': 1}), 'PRODUCT_DATA_INVALID', 422),
    (httpx.Response(200, text='<html>', request=httpx.Request('GET', 'https://example.test')), 'PRODUCT_DATA_INVALID', 422),
    (httpx.ReadTimeout('timeout'), 'FOOD_LOOKUP_TIMEOUT', 504),
    (httpx.ConnectError('connection'), 'FOOD_LOOKUP_FAILED', 502),
])
def test_failures_are_controlled_and_not_cached(cache, offline, reply, code, status):
    offline.side_effect = reply if isinstance(reply, Exception) else None
    offline.return_value = reply
    with pytest.raises(ApiError) as error:
        lookup.fetch_product(BARCODE)
    assert (error.value.code, error.value.status) == (code, status)
    assert cache.scalar(select(func.count()).select_from(ScannedProduct)) == 0


@pytest.mark.parametrize('nutrient', ['energy-kcal_100g', 'sodium_100g', 'sugars_100g'])
@pytest.mark.parametrize('value', [None, -1, True, 'NaN', 'Infinity', 'bad'])
def test_missing_or_invalid_nutrition(cache, offline, nutrient, value):
    payload = deepcopy(PAYLOAD)
    payload['product']['nutriments'][nutrient] = value
    offline.side_effect = None
    offline.return_value = response(payload)
    with pytest.raises(ApiError) as error:
        lookup.fetch_product(BARCODE)
    assert error.value.code == 'PRODUCT_DATA_INVALID'
    assert cache.scalar(select(func.count()).select_from(ScannedProduct)) == 0


def test_explicit_zero_is_valid():
    payload = deepcopy(PAYLOAD)
    payload['product']['nutriments'] = {'energy-kcal_100g': 0, 'sodium_100g': 0, 'sugars_100g': 0}
    assert lookup.normalize_product(BARCODE, payload)['calories'] == 0


def test_serving_conversion_and_kilojoules():
    product = {'product_name': 'Serving Food', 'serving_size': '1 bar (25 g)',
               'nutriments': {'energy_serving': 418.4, 'sodium_serving': 0.1, 'sugars_serving': 5}}
    result = lookup.normalize_product(BARCODE, {'status': 1, 'product': product})
    assert result['calories'] == 400 and result['sodium_mg'] == 400 and result['sugar_g'] == 20
    assert lookup.serving_grams(product) == 25
    assert lookup.nutrient_per_100g(product, 'sodium') == Decimal('0.4')


@pytest.mark.parametrize('serving', ['250 ml', '1 cup', '2 pieces', '', '0 g', '20-30 g'])
def test_unreliable_serving_rejected(serving):
    with pytest.raises(ApiError): lookup.serving_grams({'serving_size': serving})


def test_per_100g_preferred_and_units_are_normalized():
    payload = deepcopy(PAYLOAD)
    payload['product']['nutriments'].update({'sodium_unit': 'mg', 'sodium_serving': 999})
    assert lookup.normalize_product(BARCODE, payload)['sodium_mg'] == 650


@pytest.mark.parametrize('barcode', ['', '../12345678', 12345678, '１２３４５６７８', '123', '1'*15])
def test_invalid_barcodes(barcode):
    with pytest.raises(ApiError) as error: lookup.validate_barcode(barcode)
    assert error.value.code == 'VALIDATION_ERROR'


def test_demo_is_offline_and_ignores_cache(monkeypatch, offline):
    monkeypatch.setenv('DEMO_MODE', ' TRUE ')
    monkeypatch.setattr(lookup, 'Session', Mock(side_effect=AssertionError('No DB needed in demo mode')))
    result = lookup.fetch_product('2000000000015')
    assert result == lookup.read_demo_product('2000000000015')
    assert result['sodium_mg'] == 50
    assert lookup.fetch_product('2000000000022')['sugar_g'] == 40
    assert lookup.fetch_product('2000000000039')['sodium_mg'] == 2200
    with pytest.raises(ApiError) as error: lookup.fetch_product('9999999999999')
    assert error.value.code == 'PRODUCT_NOT_FOUND'
    offline.assert_not_called()


def test_bad_demo_file(monkeypatch, tmp_path):
    path = tmp_path / 'demo.json'
    path.write_text('not json')
    monkeypatch.setattr(lookup, 'DEMO_PATH', path)
    with pytest.raises(ApiError) as error: lookup.read_demo_product(BARCODE)
    assert error.value.code == 'PRODUCT_DATA_INVALID'


def test_request_helper(offline):
    offline.side_effect = None
    offline.return_value = response()
    assert lookup.request_product(BARCODE) == PAYLOAD
    assert lookup.nutrition_number('1.5') == Decimal('1.5')
    assert lookup.validate_barcode('0012345678901') == '0012345678901'


def test_per_100g_kj_preferred_over_serving_kcal():
    payload = deepcopy(PAYLOAD)
    nutrients = payload['product']['nutriments']
    del nutrients['energy-kcal_100g']
    nutrients.update({'energy_100g': 418.4, 'energy-kcal_serving': 20})
    assert lookup.normalize_product(BARCODE, payload)['calories'] == 100


@pytest.mark.parametrize('change', [
    {'nutrition_data_per': '100ml'}, {'serving_size': '250 ml'},
    {'product_name': ''}, {'nutriments': []}, {'unused': float('nan')},
    {'unused': '\x00'},
])
def test_unreliable_response_data(change):
    payload = deepcopy(PAYLOAD)
    payload['product'].update(change)
    with pytest.raises(ApiError) as error: lookup.normalize_product(BARCODE, payload)
    assert error.value.code == 'PRODUCT_DATA_INVALID'


def test_database_failure_is_controlled(monkeypatch):
    from sqlalchemy.exc import SQLAlchemyError
    monkeypatch.setattr(lookup, 'Session', Mock(side_effect=SQLAlchemyError('private detail')))
    with pytest.raises(ApiError) as error: lookup.fetch_product(BARCODE)
    assert error.value.code == 'DATABASE_ERROR'
    assert 'private' not in error.value.message
