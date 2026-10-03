from types import SimpleNamespace

from app.scan import matching_allergens, return_scan_result


def test_matching_allergens_uses_risk_aliases_and_deduplicates():
    raw = {'product': {'allergens_tags': ['en:milk', 'en:eggs']}}
    assert matching_allergens([' MILK ', 'milk', 'egg', 'peanuts'], raw) == ['egg', 'milk']
    assert matching_allergens(['milk'], {'product': {'ingredients_text': 'milk'}}) == []
    assert matching_allergens(['milk'], {'product': {'allergens_tags': ['en:milk-chocolate']}}) == []


def test_scan_response_exposes_matching_allergens():
    product = dict(barcode='12345678', name='Milk', calories=10, sodium_mg=1, sugar_g=1,
                   raw_response={'product': {'allergens': 'en:milk,en:soy'}})
    result = return_scan_result(product, dict(sodium_pct=0.1, sugar_pct=0.1, calorie_pct=0.1),
                                dict(risk_label='danger', reasons=['Allergy match']),
                                SimpleNamespace(id=1), None, allergies=['milk', 'peanut'])
    assert result.model_dump()['matched_allergens'] == ['milk']
