"""Unit tests for services.job_scope.apply_config_scope.

Tests compile the SQL statement and inspect the rendered WHERE clauses
to verify each filter is applied correctly — no DB connection needed.
"""

from unittest.mock import MagicMock

from sqlalchemy import select
from sqlalchemy.dialects import postgresql

from models.job import Job
from services.job_scope import apply_config_scope


def _render(stmt) -> str:  # noqa: ANN001
    """Compile a SQLAlchemy statement to a Postgres SQL string for inspection."""
    return str(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))


def _where_clause(stmt) -> str:  # noqa: ANN001
    """Return only the WHERE portion of the compiled SQL (after 'WHERE')."""
    sql = _render(stmt)
    idx = sql.upper().find("WHERE")
    return sql[idx:] if idx != -1 else ""


def _mock_config(**overrides) -> MagicMock:  # noqa: ANN003
    defaults = {
        "target_titles": None,
        "location_type_pref": None,
        "min_salary": None,
        "max_salary": None,
        "excluded_companies": None,
        "employment_type_pref": None,
        "experience_level": None,
    }
    defaults.update(overrides)
    config = MagicMock()
    for k, v in defaults.items():
        setattr(config, k, v)
    return config


class TestNoConfig:
    def test_none_config_only_adds_is_active(self) -> None:
        stmt = apply_config_scope(select(Job), None)
        where = _where_clause(stmt)
        assert "is_active" in where
        # Should NOT contain any preference filters
        assert "ILIKE" not in where.upper()
        assert "salary" not in where.lower()

    def test_empty_config_only_adds_is_active(self) -> None:
        config = _mock_config()
        stmt = apply_config_scope(select(Job), config)
        where = _where_clause(stmt)
        assert "is_active" in where
        assert "ILIKE" not in where.upper()


class TestTitleFilter:
    def test_single_title(self) -> None:
        config = _mock_config(target_titles=["Python Developer"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "ILIKE" in sql.upper()
        assert "%Python Developer%" in sql

    def test_multiple_titles_use_or(self) -> None:
        config = _mock_config(target_titles=["Python Developer", "Data Engineer"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "%Python Developer%" in sql
        assert "%Data Engineer%" in sql
        assert "OR" in sql.upper()


class TestLocationTypeFilter:
    def test_location_type_pref(self) -> None:
        config = _mock_config(location_type_pref=["remote", "hybrid"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "remote" in sql
        assert "hybrid" in sql
        # NULL pass-through
        assert "IS NULL" in sql.upper()


class TestSalaryFilters:
    def test_min_salary(self) -> None:
        config = _mock_config(min_salary=80000)
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "salary_min" in sql
        assert "80000" in sql

    def test_max_salary(self) -> None:
        config = _mock_config(max_salary=150000)
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "salary_max" in sql
        assert "150000" in sql


class TestExcludedCompanies:
    def test_single_excluded(self) -> None:
        config = _mock_config(excluded_companies=["Acme"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "NOT" in sql.upper()
        assert "%Acme%" in sql

    def test_null_company_passes(self) -> None:
        config = _mock_config(excluded_companies=["Acme"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "IS NULL" in sql.upper()


class TestEmploymentTypeFilter:
    def test_employment_type_pref(self) -> None:
        config = _mock_config(employment_type_pref=["full_time", "contract"])
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "employment_type" in sql
        assert "full_time" in sql
        assert "contract" in sql


class TestExperienceLevelFilter:
    def test_experience_level(self) -> None:
        config = _mock_config(experience_level="senior")
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)
        assert "experience_level" in sql
        assert "senior" in sql
        # NULL pass-through
        assert "IS NULL" in sql.upper()


class TestAllFiltersCombined:
    def test_all_filters(self) -> None:
        config = _mock_config(
            target_titles=["Engineer"],
            location_type_pref=["remote"],
            min_salary=70000,
            max_salary=200000,
            excluded_companies=["BadCorp"],
            employment_type_pref=["full_time"],
            experience_level="mid",
        )
        stmt = apply_config_scope(select(Job), config)
        sql = _render(stmt)

        assert "is_active" in sql
        assert "%Engineer%" in sql
        assert "remote" in sql
        assert "70000" in sql
        assert "200000" in sql
        assert "%BadCorp%" in sql
        assert "full_time" in sql
        assert "mid" in sql
