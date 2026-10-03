import pytest
from pydantic import ValidationError
from app.schemas import RegisterInput


def test_email_password_registration_without_name():
    data = RegisterInput(email=' Person@example.test ', password='Password123!')
    assert data.email == 'person@example.test'
    assert data.name == 'Caregiver'


def test_existing_named_registration_remains_supported():
    assert RegisterInput(name='Alex', email='alex@example.test', password='Password123!').name == 'Alex'


def test_registration_still_requires_valid_password():
    with pytest.raises(ValidationError):
        RegisterInput(email='person@example.test', password='short')
