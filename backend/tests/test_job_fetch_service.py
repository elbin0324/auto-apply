"""Tests for the job fetch service (services/job_fetch_service.py)."""

from types import SimpleNamespace

from services.job_fetch_service import _build_search_params


def _mock_config(**overrides: object) -> SimpleNamespace:
    """Build a mock AutoApplyConfig with sensible defaults."""
    defaults: dict = {
        "target_titles": ["Senior Engineer"],
        "target_locations": ["San Francisco"],
        "location_type_pref": None,
        "experience_level": None,
        "excluded_companies": None,
        "preferred_industries": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class TestBuildSearchParams:
    def test_single_title(self) -> None:
        config = _mock_config(target_titles=["Senior Engineer"])
        params = _build_search_params(config)
        assert params is not None
        assert params.advanced_title_filter == "'Senior Engineer'"

    def test_multiple_titles_or_combined(self) -> None:
        config = _mock_config(target_titles=["Senior Engineer", "Tech Lead", "Staff Dev"])
        params = _build_search_params(config)
        assert params is not None
        assert params.advanced_title_filter == "'Senior Engineer' | 'Tech Lead' | 'Staff Dev'"

    def test_single_location(self) -> None:
        config = _mock_config(target_locations=["New York"])
        params = _build_search_params(config)
        assert params is not None
        assert params.location_filter == '"New York"'

    def test_multiple_locations_or_combined(self) -> None:
        config = _mock_config(target_locations=["San Francisco", "New York"])
        params = _build_search_params(config)
        assert params is not None
        assert params.location_filter == '"San Francisco" OR "New York"'

    def test_no_locations(self) -> None:
        config = _mock_config(target_locations=None)
        params = _build_search_params(config)
        assert params is not None
        assert params.location_filter is None

    def test_empty_locations(self) -> None:
        config = _mock_config(target_locations=[])
        params = _build_search_params(config)
        assert params is not None
        assert params.location_filter is None

    def test_returns_none_when_no_titles(self) -> None:
        config = _mock_config(target_titles=None)
        assert _build_search_params(config) is None

    def test_returns_none_when_empty_titles(self) -> None:
        config = _mock_config(target_titles=[])
        assert _build_search_params(config) is None

    def test_remote_only_preference(self) -> None:
        config = _mock_config(location_type_pref=["remote"])
        params = _build_search_params(config)
        assert params is not None
        assert params.remote is True
        assert "Remote Solely" in params.ai_work_arrangement_filter
        assert "Remote OK" in params.ai_work_arrangement_filter

    def test_hybrid_preference(self) -> None:
        config = _mock_config(location_type_pref=["hybrid"])
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_work_arrangement_filter == "Hybrid"
        assert params.remote is None  # not exclusively remote

    def test_onsite_preference(self) -> None:
        config = _mock_config(location_type_pref=["onsite"])
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_work_arrangement_filter == "On-site"

    def test_mixed_location_type_prefs(self) -> None:
        config = _mock_config(location_type_pref=["remote", "hybrid"])
        params = _build_search_params(config)
        assert params is not None
        assert "Remote Solely,Remote OK" in params.ai_work_arrangement_filter
        assert "Hybrid" in params.ai_work_arrangement_filter
        assert params.remote is None  # not exclusively remote

    def test_experience_level_entry(self) -> None:
        config = _mock_config(experience_level="entry")
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_experience_level_filter == "0-2"

    def test_experience_level_mid(self) -> None:
        config = _mock_config(experience_level="mid")
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_experience_level_filter == "2-5"

    def test_experience_level_senior(self) -> None:
        config = _mock_config(experience_level="senior")
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_experience_level_filter == "5-10"

    def test_experience_level_lead(self) -> None:
        config = _mock_config(experience_level="lead")
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_experience_level_filter == "10+"

    def test_experience_level_none(self) -> None:
        config = _mock_config(experience_level=None)
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_experience_level_filter is None

    def test_excluded_companies(self) -> None:
        config = _mock_config(excluded_companies=["BadCorp", "WorstCo"])
        params = _build_search_params(config)
        assert params is not None
        assert params.organization_exclusion_filter == "BadCorp,WorstCo"

    def test_excluded_companies_none(self) -> None:
        config = _mock_config(excluded_companies=None)
        params = _build_search_params(config)
        assert params is not None
        assert params.organization_exclusion_filter is None

    def test_preferred_industries_simple(self) -> None:
        config = _mock_config(preferred_industries=["Technology", "Healthcare"])
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_taxonomies_a_filter == "Technology,Healthcare"

    def test_preferred_industries_with_ampersand(self) -> None:
        config = _mock_config(
            preferred_industries=["Technology", "Finance & Accounting"]
        )
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_taxonomies_a_filter == 'Technology,"Finance & Accounting"'

    def test_preferred_industries_none(self) -> None:
        config = _mock_config(preferred_industries=None)
        params = _build_search_params(config)
        assert params is not None
        assert params.ai_taxonomies_a_filter is None

    def test_always_sets_include_ai(self) -> None:
        config = _mock_config()
        params = _build_search_params(config)
        assert params is not None
        assert params.include_ai is True

    def test_always_sets_agency_false(self) -> None:
        config = _mock_config()
        params = _build_search_params(config)
        assert params is not None
        assert params.agency is False

    def test_full_config(self) -> None:
        """Test with all fields populated."""
        config = _mock_config(
            target_titles=["Data Engineer", "ML Engineer"],
            target_locations=["United States", "United Kingdom"],
            location_type_pref=["remote"],
            experience_level="senior",
            excluded_companies=["SpamCo"],
            preferred_industries=["Technology", "Data & Analytics"],
        )
        params = _build_search_params(config)
        assert params is not None
        assert params.advanced_title_filter == "'Data Engineer' | 'ML Engineer'"
        assert params.location_filter == '"United States" OR "United Kingdom"'
        assert params.remote is True
        assert "Remote Solely" in params.ai_work_arrangement_filter
        assert params.ai_experience_level_filter == "5-10"
        assert params.organization_exclusion_filter == "SpamCo"
        assert params.ai_taxonomies_a_filter == 'Technology,"Data & Analytics"'
