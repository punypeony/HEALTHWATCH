"""PostgreSQL schema and ORM profile maintenance."""
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (Boolean, CheckConstraint, Date, DateTime, ForeignKey, ForeignKeyConstraint,
                        Integer, Numeric, Text, UniqueConstraint, event, func)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from app.database import Base
from app.targets import compute_daily_targets


class CreatedAt:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UpdatedAt:
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(CreatedAt, Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text, unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    dependents: Mapped[list['Dependent']] = relationship(back_populates='caregiver', cascade='all, delete-orphan', passive_deletes=True)


class Dependent(CreatedAt, UpdatedAt, Base):
    __tablename__ = 'dependents'
    __table_args__ = (
        CheckConstraint('age BETWEEN 0 AND 120', name='ck_dependents_age'),
        CheckConstraint('height_cm > 0', name='ck_dependents_height'),
        CheckConstraint('weight_kg > 0', name='ck_dependents_weight'),
        CheckConstraint("sex IN ('male', 'female')", name='ck_dependents_sex'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    caregiver_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(Text)
    age: Mapped[int] = mapped_column(Integer)
    height_cm: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    sex: Mapped[str] = mapped_column(Text)
    caregiver: Mapped[User] = relationship(back_populates='dependents')
    dietary_profile: Mapped['DietaryProfile'] = relationship(back_populates='dependent', cascade='all, delete-orphan', single_parent=True, passive_deletes=True)
    meal_logs: Mapped[list['MealLog']] = relationship(back_populates='dependent', passive_deletes='all')
    alerts: Mapped[list['Alert']] = relationship(back_populates='dependent', passive_deletes='all')
    summaries: Mapped[list['Summary']] = relationship(back_populates='dependent', passive_deletes='all')


class DietaryProfile(CreatedAt, UpdatedAt, Base):
    __tablename__ = 'dietary_profiles'
    __table_args__ = tuple(CheckConstraint(f'{field} > 0', name=f'ck_profiles_{field}') for field in ('daily_sodium_mg', 'daily_sugar_g', 'daily_calories'))
    id: Mapped[int] = mapped_column(primary_key=True)
    dependent_id: Mapped[int] = mapped_column(ForeignKey('dependents.id', ondelete='CASCADE'), unique=True)
    allergies: Mapped[list[str]] = mapped_column(MutableList.as_mutable(ARRAY(Text)), default=list, server_default='{}')
    conditions: Mapped[list[str]] = mapped_column(MutableList.as_mutable(ARRAY(Text)), default=list, server_default='{}')
    daily_sodium_mg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    daily_sugar_g: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    daily_calories: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    dependent: Mapped[Dependent] = relationship(back_populates='dietary_profile')


class ScannedProduct(Base):
    __tablename__ = 'scanned_products'
    __table_args__ = tuple(CheckConstraint(f'{field} >= 0', name=f'ck_products_{field}') for field in ('calories', 'sodium_mg', 'sugar_g'))
    id: Mapped[int] = mapped_column(primary_key=True)
    barcode: Mapped[str] = mapped_column(Text, unique=True, index=True)
    name: Mapped[str] = mapped_column(Text)
    calories: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    sodium_mg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    sugar_g: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    raw_response: Mapped[dict] = mapped_column(JSONB)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    meal_logs: Mapped[list['MealLog']] = relationship(back_populates='product', passive_deletes='all')


class MealLog(CreatedAt, Base):
    __tablename__ = 'meal_logs'
    __table_args__ = (
        CheckConstraint("risk_label IN ('safe', 'warning', 'danger')", name='ck_meal_logs_risk'),
        CheckConstraint(
            '(eaten = false AND grams_eaten IS NULL) OR (eaten = true AND grams_eaten > 0)',
            name='ck_meal_logs_eaten_grams',
        ),
        UniqueConstraint('id', 'dependent_id', name='uq_meal_logs_id_dependent'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    dependent_id: Mapped[int] = mapped_column(ForeignKey('dependents.id', ondelete='CASCADE'), index=True)
    scanned_product_id: Mapped[int] = mapped_column(ForeignKey('scanned_products.id', ondelete='RESTRICT'), index=True)
    risk_label: Mapped[str] = mapped_column(Text)
    risk_reasons: Mapped[list] = mapped_column(JSONB)
    eaten: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    grams_eaten: Mapped[Decimal | None] = mapped_column(Numeric(7, 2))
    dependent: Mapped[Dependent] = relationship(back_populates='meal_logs')
    product: Mapped[ScannedProduct] = relationship(back_populates='meal_logs')
    alerts: Mapped[list['Alert']] = relationship(back_populates='meal_log', foreign_keys='Alert.meal_log_id', passive_deletes='all')


class Alert(CreatedAt, Base):
    __tablename__ = 'alerts'
    __table_args__ = (
        CheckConstraint("status IN ('active', 'acknowledged')", name='ck_alerts_status'),
        ForeignKeyConstraint(['meal_log_id', 'dependent_id'], ['meal_logs.id', 'meal_logs.dependent_id'], ondelete='CASCADE', name='fk_alert_meal_owner'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    dependent_id: Mapped[int] = mapped_column(ForeignKey('dependents.id', ondelete='CASCADE'), index=True)
    meal_log_id: Mapped[int] = mapped_column(Integer, index=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default='active', server_default='active')
    dependent: Mapped[Dependent] = relationship(back_populates='alerts', foreign_keys=[dependent_id])
    meal_log: Mapped[MealLog] = relationship(back_populates='alerts', foreign_keys=[meal_log_id])


class Summary(CreatedAt, Base):
    __tablename__ = 'summaries'
    __table_args__ = (UniqueConstraint('dependent_id', 'week_start', name='uq_summary_week'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    dependent_id: Mapped[int] = mapped_column(ForeignKey('dependents.id', ondelete='CASCADE'), index=True)
    week_start: Mapped[date] = mapped_column(Date)
    text: Mapped[str] = mapped_column(Text)
    dependent: Mapped[Dependent] = relationship(back_populates='summaries')


@event.listens_for(Session, 'before_flush')
def maintain_dietary_profiles(session, flush_context, instances):
    """ORM writes maintain one current profile and never trust supplied targets.

    Use normal Session.add/commit writes, not bulk SQL, for dependent/profile
    mutations. Bulk SQL bypasses this hook (but not database constraints).
    """
    candidates = set(session.new) | set(session.dirty)
    for obj in session.deleted:
        if isinstance(obj, DietaryProfile) and obj.dependent not in session.deleted:
            raise ValueError('Delete the dependent, not its required dietary profile.')
    dependents = {obj for obj in candidates if isinstance(obj, Dependent)}
    for obj in candidates:
        if isinstance(obj, DietaryProfile):
            dependent = obj.dependent or session.get(Dependent, obj.dependent_id)
            if dependent is not None:
                dependents.add(dependent)
    for dependent in dependents:
        if dependent in session.deleted:
            continue
        profile = dependent.dietary_profile
        if profile is None:
            profile = DietaryProfile(allergies=[], conditions=[])
            dependent.dietary_profile = profile
        if profile in session.deleted:
            raise ValueError('Delete the dependent, not its required dietary profile.')
        profile.conditions = [value.strip().lower() for value in (profile.conditions or [])]
        profile.allergies = [value.strip().lower() for value in (profile.allergies or [])]
        for field, value in compute_daily_targets(dependent.age, dependent.height_cm,
                dependent.weight_kg, dependent.sex, profile.conditions).items():
            setattr(profile, field, value)
