"""Tests for the job fetch service (workers/services/job_fetch.py)."""

from types import SimpleNamespace

from workers.services.job_fetch import _build_relaxed_params, _build_search_params
from workers.services.job_search_api import JobSearchParams


def _mock_config(**overrides: object) -> SimpleNamespace:
    """Build a mock AutoApplyConfig with sensible defaults."""
    defaults: dict = {
        "target_titles": ["Senior Engineer"],
        "target_locations": ["San Francisco"],
        "location_type_pref": None,
        "experience_level": None,
        "excluded_companies": None,
        "preferred_industries": None,
        "employment_type_pref": None,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class TestBuildSearchParams:
    def test_single_title_uses_advanced_filter(self) -> None:
        config = _mock_config(target_titles=["Senior Engineer"])
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        assert params_list[0].advanced_title_filter is not None
        assert "engineer:*" in params_list[0].advanced_title_filter
        assert params_list[0].title_filter is None

    def test_multiple_titles_combined_into_one_query(self) -> None:
        config = _mock_config(target_titles=["Senior Engineer", "Tech Lead", "Staff Dev"])
        params_list = _build_search_params(config)
        # Should be a single query, not N queries
        assert len(params_list) == 1
        advanced = params_list[0].advanced_title_filter
        assert "engineer:*" in advanced
        # "Tech" is not a filler word, should appear
        assert "tech:*" in advanced
        assert "dev:*" in advanced
        # Uses OR between titles
        assert " | " in advanced

    def test_seniority_stripped_from_titles(self) -> None:
        config = _mock_config(target_titles=["Senior Full Stack React Developer"])
        params_list = _build_search_params(config)
        advanced = params_list[0].advanced_title_filter
        assert "senior:*" not in advanced
        assert "full:*" in advanced
        assert "stack:*" in advanced
        assert "react:*" in advanced
        assert "developer:*" in advanced

    def test_single_location_normalized(self) -> None:
        config = _mock_config(target_locations=["San Francisco, CA"])
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        # Should be normalized to full state name
        assert "California" in params_list[0].location_filter
        assert "United States" in params_list[0].location_filter

    def test_multiple_locations_or_combined(self) -> None:
        config = _mock_config(target_locations=["San Francisco", "New York"])
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        assert params_list[0].location_filter == "San Francisco OR New York"

    def test_location_aliases_expanded(self) -> None:
        config = _mock_config(target_locations=["NYC"])
        params_list = _build_search_params(config)
        assert params_list[0].location_filter == "New York"

    def test_no_locations(self) -> None:
        config = _mock_config(target_locations=None)
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        assert params_list[0].location_filter is None

    def test_empty_locations(self) -> None:
        config = _mock_config(target_locations=[])
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        assert params_list[0].location_filter is None

    def test_returns_empty_when_no_titles(self) -> None:
        config = _mock_config(target_titles=None)
        assert _build_search_params(config) == []

    def test_returns_empty_when_empty_titles(self) -> None:
        config = _mock_config(target_titles=[])
        assert _build_search_params(config) == []

    def test_remote_only_preference_no_double_filter(self) -> None:
        """remote preference should only set ai_work_arrangement_filter, not remote=True."""
        config = _mock_config(location_type_pref=["remote"])
        params_list = _build_search_params(config)
        assert len(params_list) == 1
        params = params_list[0]
        # Should NOT set remote=True (double filtering fix)
        assert params.remote is None
        assert "Remote Solely" in params.ai_work_arrangement_filter
        assert "Remote OK" in params.ai_work_arrangement_filter

    def test_hybrid_preference(self) -> None:
        config = _mock_config(location_type_pref=["hybrid"])
        params_list = _build_search_params(config)
        params = params_list[0]
        assert params.ai_work_arrangement_filter == "Hybrid"
        assert params.remote is None

    def test_onsite_preference(self) -> None:
        config = _mock_config(location_type_pref=["onsite"])
        params_list = _build_search_params(config)
        params = params_list[0]
        assert params.ai_work_arrangement_filter == "On-site"

    def test_mixed_location_type_prefs(self) -> None:
        config = _mock_config(location_type_pref=["remote", "hybrid"])
        params_list = _build_search_params(config)
        params = params_list[0]
        assert "Remote Solely,Remote OK" in params.ai_work_arrangement_filter
        assert "Hybrid" in params.ai_work_arrangement_filter
        assert params.remote is None

    def test_experience_level_entry(self) -> None:
        config = _mock_config(experience_level="entry")
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter == "0-2"

    def test_experience_level_mid(self) -> None:
        config = _mock_config(experience_level="mid")
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter == "2-5"

    def test_experience_level_senior(self) -> None:
        config = _mock_config(experience_level="senior")
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter == "5-10"

    def test_experience_level_lead(self) -> None:
        config = _mock_config(experience_level="lead")
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter == "10+"

    def test_experience_level_executive(self) -> None:
        config = _mock_config(experience_level="executive")
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter == "10+"

    def test_experience_level_none(self) -> None:
        config = _mock_config(experience_level=None)
        params_list = _build_search_params(config)
        assert params_list[0].ai_experience_level_filter is None

    def test_excluded_companies(self) -> None:
        config = _mock_config(excluded_companies=["BadCorp", "WorstCo"])
        params_list = _build_search_params(config)
        assert params_list[0].organization_exclusion_filter == "BadCorp,WorstCo"

    def test_excluded_companies_none(self) -> None:
        config = _mock_config(excluded_companies=None)
        params_list = _build_search_params(config)
        assert params_list[0].organization_exclusion_filter is None

    def test_preferred_industries_normalized(self) -> None:
        """User-entered 'Tech' should be normalized to API taxonomy 'Technology'."""
        config = _mock_config(preferred_industries=["Tech", "Healthcare"])
        params_list = _build_search_params(config)
        assert params_list[0].ai_taxonomies_a_filter == "Technology,Healthcare"

    def test_preferred_industries_with_ampersand(self) -> None:
        config = _mock_config(
            preferred_industries=["Technology", "Finance & Accounting"]
        )
        params_list = _build_search_params(config)
        assert params_list[0].ai_taxonomies_a_filter == 'Technology,"Finance & Accounting"'

    def test_preferred_industries_alias(self) -> None:
        config = _mock_config(preferred_industries=["Finance"])
        params_list = _build_search_params(config)
        assert params_list[0].ai_taxonomies_a_filter == '"Finance & Accounting"'

    def test_preferred_industries_none(self) -> None:
        config = _mock_config(preferred_industries=None)
        params_list = _build_search_params(config)
        assert params_list[0].ai_taxonomies_a_filter is None

    def test_preferred_industries_unrecognized_dropped(self) -> None:
        config = _mock_config(preferred_industries=["FakeIndustry"])
        params_list = _build_search_params(config)
        assert params_list[0].ai_taxonomies_a_filter is None

    def test_employment_type_full_time(self) -> None:
        config = _mock_config(employment_type_pref=["full_time"])
        params_list = _build_search_params(config)
        assert params_list[0].ai_employment_type_filter == "FULL_TIME"

    def test_employment_type_multiple(self) -> None:
        config = _mock_config(employment_type_pref=["full_time", "contract"])
        params_list = _build_search_params(config)
        assert params_list[0].ai_employment_type_filter == "FULL_TIME,CONTRACTOR"

    def test_employment_type_none(self) -> None:
        config = _mock_config(employment_type_pref=None)
        params_list = _build_search_params(config)
        assert params_list[0].ai_employment_type_filter is None

    def test_always_sets_include_ai(self) -> None:
        config = _mock_config()
        params_list = _build_search_params(config)
        assert params_list[0].include_ai is True

    def test_always_sets_agency_false(self) -> None:
        config = _mock_config()
        params_list = _build_search_params(config)
        assert params_list[0].agency is False

    def test_full_config(self) -> None:
        """Test with all fields populated."""
        config = _mock_config(
            target_titles=["Data Engineer", "ML Engineer"],
            target_locations=["United States", "UK"],
            location_type_pref=["remote"],
            experience_level="senior",
            excluded_companies=["SpamCo"],
            preferred_industries=["Tech", "Data & Analytics"],
            employment_type_pref=["full_time"],
        )
        params_list = _build_search_params(config)
        # Single combined query
        assert len(params_list) == 1
        params = params_list[0]
        # Both titles combined
        assert "data:*" in params.advanced_title_filter
        assert "ml:*" in params.advanced_title_filter
        assert " | " in params.advanced_title_filter
        # UK normalized
        assert "United Kingdom" in params.location_filter
        # No double remote filtering
        assert params.remote is None
        assert "Remote Solely" in params.ai_work_arrangement_filter
        assert params.ai_experience_level_filter == "5-10"
        assert params.organization_exclusion_filter == "SpamCo"
        # Tech normalized to Technology
        assert "Technology" in params.ai_taxonomies_a_filter
        assert params.ai_employment_type_filter == "FULL_TIME"


class TestBuildRelaxedParams:
    def test_relaxation_levels(self) -> None:
        """Should produce up to 3 levels of relaxation."""
        base = JobSearchParams(
            advanced_title_filter="(engineer:*)",
            location_filter="San Francisco",
            ai_work_arrangement_filter="Remote Solely,Remote OK",
            ai_experience_level_filter="2-5",
            ai_taxonomies_a_filter="Technology",
        )
        levels = _build_relaxed_params(base)
        assert len(levels) == 3

        # Level 1: industry dropped
        assert levels[0].ai_taxonomies_a_filter is None
        assert levels[0].ai_experience_level_filter == "2-5"
        assert levels[0].location_filter == "San Francisco"

        # Level 2: industry + experience dropped
        assert levels[1].ai_taxonomies_a_filter is None
        assert levels[1].ai_experience_level_filter is None
        assert levels[1].location_filter == "San Francisco"

        # Level 3: industry + experience + location dropped
        assert levels[2].ai_taxonomies_a_filter is None
        assert levels[2].ai_experience_level_filter is None
        assert levels[2].ai_work_arrangement_filter is None
        assert levels[2].location_filter is None

    def test_no_relaxation_when_no_droppable_filters(self) -> None:
        """If the base params have no droppable filters, no relaxation levels."""
        base = JobSearchParams(
            advanced_title_filter="(engineer:*)",
        )
        levels = _build_relaxed_params(base)
        assert levels == []

    def test_partial_relaxation(self) -> None:
        """Only filters that exist produce relaxation levels."""
        base = JobSearchParams(
            advanced_title_filter="(engineer:*)",
            ai_experience_level_filter="2-5",
        )
        levels = _build_relaxed_params(base)
        # Only 1 level: drop experience (no industry or location to drop)
        assert len(levels) == 1
        assert levels[0].ai_experience_level_filter is None

    def test_title_filter_preserved(self) -> None:
        """Title filter should never be dropped."""
        base = JobSearchParams(
            advanced_title_filter="(engineer:*)",
            ai_taxonomies_a_filter="Technology",
            ai_experience_level_filter="2-5",
            location_filter="New York",
        )
        levels = _build_relaxed_params(base)
        for level in levels:
            assert level.advanced_title_filter == "(engineer:*)"
