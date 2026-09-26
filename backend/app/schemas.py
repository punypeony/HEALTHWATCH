"""Input allowlists and explicit public response contracts."""
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_serializer, model_validator

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200, pattern=r'^[^\x00]+$')]
Label = Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=1, max_length=100, pattern=r'^[^\x00]+$')]
Measurement = Annotated[Decimal, Field(gt=0, max_digits=7, decimal_places=2, allow_inf_nan=False)]
Age = Annotated[int, Field(strict=True, ge=0, le=120)]
Sex = Literal['male', 'female']


class InputModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class LoginInput(InputModel):
    email: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, max_length=254, pattern=r'^[^\s@\x00]+@[^\s@\x00]+\.[^\s@\x00]+$')]
    password: Annotated[str, Field(min_length=1, max_length=1024)]


class RegisterInput(LoginInput):
    name: Name
    password: Annotated[str, Field(min_length=8, max_length=1024)]


class UserOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    created_at: datetime


class TokenOutput(BaseModel):
    access_token: str
    token_type: Literal['bearer'] = 'bearer'


class DependentCreate(InputModel):
    name: Name
    age: Age
    height_cm: Measurement
    weight_kg: Measurement
    sex: Sex
    allergies: list[Label] = Field(default_factory=list, max_length=100)
    conditions: list[Label] = Field(default_factory=list, max_length=100)

    @field_validator('allergies', 'conditions')
    @classmethod
    def unique_labels(cls, values):
        return list(dict.fromkeys(values))


class DependentPatch(InputModel):
    name: Name | None = None
    age: Age | None = None
    height_cm: Measurement | None = None
    weight_kg: Measurement | None = None
    sex: Sex | None = None
    allergies: list[Label] | None = Field(default=None, max_length=100)
    conditions: list[Label] | None = Field(default=None, max_length=100)

    @model_validator(mode='after')
    def reject_nulls(self):
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError('Omit unchanged fields; explicit null is not supported.')
        return self

    @field_validator('allergies', 'conditions')
    @classmethod
    def unique_labels(cls, values):
        return None if values is None else list(dict.fromkeys(values))


class ProfileOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    allergies: list[str]
    conditions: list[str]
    daily_sodium_mg: float
    daily_sugar_g: float
    daily_calories: float


class DependentOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    age: int
    height_cm: float
    weight_kg: float
    sex: Sex
    created_at: datetime
    updated_at: datetime
    dietary_profile: ProfileOutput


class MealOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dependent_id: int
    scanned_product_id: int
    risk_label: Literal['safe', 'warning', 'danger']
    risk_reasons: list[str]
    created_at: datetime


class AlertOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dependent_id: int
    meal_log_id: int
    message: str
    status: Literal['active', 'acknowledged']
    created_at: datetime
    product_name: str
    risk_label: Literal['safe', 'warning', 'danger']

    @model_validator(mode='before')
    @classmethod
    def include_meal(cls, value):
        meal = getattr(value, 'meal_log', None)
        if meal is None:
            return value
        product = getattr(meal, 'product', None)
        return {
            'id': value.id,
            'dependent_id': value.dependent_id,
            'meal_log_id': value.meal_log_id,
            'message': value.message,
            'status': value.status,
            'created_at': value.created_at,
            'product_name': product.name if product is not None else '',
            'risk_label': meal.risk_label,
        }


class WeeklySummaryOutput(BaseModel):
    total_scans: int
    safe_count: int
    warning_count: int
    danger_count: int
    common_reason: str | None
    text: str


class AlertPatch(InputModel):
    status: Literal['acknowledged']


class ScanInput(InputModel):
    barcode: str = Field(strict=True, min_length=8, max_length=14, pattern=r'^[0-9]+$')


class ScanProductOutput(BaseModel):
    barcode: str
    name: str
    calories: float
    sodium_mg: float
    sugar_g: float


class PercentagesOutput(BaseModel):
    sodium_pct: float
    sugar_pct: float
    calorie_pct: float


class ScanOutput(BaseModel):
    risk_label: Literal['safe', 'warning', 'danger']
    product: ScanProductOutput
    percentages: PercentagesOutput
    reasons: list[str]
    meal_log_id: int
    alert_id: int | None
    saturated_fat_g: float | None = None
    carbohydrate_g: float | None = None
    protein_g: float | None = None

    @model_serializer(mode='wrap')
    def _omit_unused_grams(self, handler):
        data = handler(self)
        for key in ('saturated_fat_g', 'carbohydrate_g', 'protein_g'):
            if data.get(key) is None:
                data.pop(key, None)
        return data
