"""Tests for the location normalizer (workers/services/location_normalizer.py)."""

from workers.services.location_normalizer import normalize_location, normalize_locations


class TestNormalizeLocation:
    def test_city_with_state_abbreviation(self) -> None:
        assert normalize_location("San Francisco, CA") == "San Francisco, California, United States"

    def test_city_with_state_abbreviation_lowercase(self) -> None:
        assert normalize_location("austin, tx") == "austin, Texas, United States"

    def test_city_alias_nyc(self) -> None:
        assert normalize_location("NYC") == "New York"

    def test_city_alias_sf(self) -> None:
        assert normalize_location("SF") == "San Francisco"

    def test_city_alias_case_insensitive(self) -> None:
        assert normalize_location("nyc") == "New York"
        assert normalize_location("Nyc") == "New York"

    def test_country_abbreviation_uk(self) -> None:
        assert normalize_location("UK") == "United Kingdom"

    def test_country_abbreviation_usa(self) -> None:
        assert normalize_location("USA") == "United States"

    def test_country_abbreviation_us(self) -> None:
        assert normalize_location("US") == "United States"

    def test_standalone_state_abbreviation(self) -> None:
        assert normalize_location("NY") == "New York, United States"

    def test_full_name_passthrough(self) -> None:
        assert normalize_location("San Francisco") == "San Francisco"
        assert normalize_location("United States") == "United States"
        assert normalize_location("California") == "California"

    def test_empty_string(self) -> None:
        assert normalize_location("") == ""

    def test_whitespace_handling(self) -> None:
        assert normalize_location("  NYC  ") == "New York"
        result = normalize_location(" San Francisco, CA ")
        assert result == "San Francisco, California, United States"

    def test_bay_area_alias(self) -> None:
        assert normalize_location("bay area") == "San Francisco"

    def test_silicon_valley_alias(self) -> None:
        assert normalize_location("silicon valley") == "San Jose"

    def test_dc_alias(self) -> None:
        # "dc" matches the city alias first, which maps to "Washington"
        assert normalize_location("dc") == "Washington"
        assert normalize_location("DC") == "Washington"

    def test_country_code_de(self) -> None:
        assert normalize_location("DE") == "Germany"

    def test_multi_word_city_with_state(self) -> None:
        assert normalize_location("New York, NY") == "New York, New York, United States"


class TestNormalizeLocations:
    def test_multiple_locations(self) -> None:
        result = normalize_locations(["NYC", "San Francisco, CA", "United Kingdom"])
        assert result == ["New York", "San Francisco, California, United States", "United Kingdom"]

    def test_empty_list(self) -> None:
        assert normalize_locations([]) == []

    def test_filters_empty_strings(self) -> None:
        result = normalize_locations(["NYC", "", "SF"])
        assert result == ["New York", "San Francisco"]
