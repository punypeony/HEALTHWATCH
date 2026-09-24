"""Rolling 7-day meal statistics and one stored summary per window."""
from datetime import date

from sqlalchemy import Date, cast, func, select, text
from sqlalchemy.orm import Session

from app.models import MealLog, Summary

WINDOW = text("interval '7 days'")
TOPICS = ('sodium', 'sugar', 'calorie', 'allergy', 'condition')


def week_window_start(session: Session) -> date:
    """UTC date at the start of the rolling 7-day window."""
    return session.scalar(select(cast(func.timezone('UTC', func.now()) - WINDOW, Date)))


def count_risks(session: Session, dependent_id: int) -> dict[str, int]:
    cutoff = func.now() - WINDOW
    rows = session.execute(
        select(MealLog.risk_label, func.count())
        .where(MealLog.dependent_id == dependent_id, MealLog.created_at >= cutoff)
        .group_by(MealLog.risk_label)
    ).all()
    counts = {label: count for label, count in rows}
    return {
        'safe': int(counts.get('safe', 0)),
        'warning': int(counts.get('warning', 0)),
        'danger': int(counts.get('danger', 0)),
    }


def common_reason_topic(session: Session, dependent_id: int) -> str | None:
    """Most frequent reason text in the window, reduced to a nutrition topic."""
    row = session.execute(text("""
        SELECT reason, count(*) AS n
        FROM meal_logs, jsonb_array_elements_text(risk_reasons) AS reason
        WHERE dependent_id = :dependent_id
          AND created_at >= now() - interval '7 days'
        GROUP BY reason
        ORDER BY n DESC, reason ASC
        LIMIT 1
    """), {'dependent_id': dependent_id}).first()
    if row is None:
        return None
    text_value = str(row[0]).lower()
    for topic in TOPICS:
        if topic in text_value:
            return topic
    return None


def summary_text(total: int, safe: int, warning: int, danger: int, topic: str | None) -> str:
    if total == 0:
        return 'No scans were recorded in the last 7 days.'
    if danger and topic:
        noun = 'scan' if danger == 1 else 'scans'
        return f'{danger} danger-level {noun} this week, mostly {topic}-related.'
    noun = 'scan' if total == 1 else 'scans'
    return f'{total} {noun} this week: {safe} safe, {warning} warning, and {danger} danger.'


def weekly_summary(session: Session, dependent_id: int) -> dict:
    """Aggregate with SQL and keep a single summary row for this window."""
    counts = count_risks(session, dependent_id)
    total = counts['safe'] + counts['warning'] + counts['danger']
    topic = common_reason_topic(session, dependent_id) if total else None
    text_value = summary_text(total, counts['safe'], counts['warning'], counts['danger'], topic)
    start = week_window_start(session)
    stored = session.scalar(select(Summary).where(
        Summary.dependent_id == dependent_id, Summary.week_start == start))
    if stored is None:
        stored = Summary(dependent_id=dependent_id, week_start=start, text=text_value)
        session.add(stored)
    elif stored.text != text_value:
        stored.text = text_value
    return {
        'total_scans': total,
        'safe_count': counts['safe'],
        'warning_count': counts['warning'],
        'danger_count': counts['danger'],
        'common_reason': topic,
        'text': text_value,
        'week_start': start,
    }
