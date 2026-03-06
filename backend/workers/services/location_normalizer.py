"""Location normalizer — expands abbreviations and aliases for the Active Jobs DB API.

The API requires full names (e.g. "California", "United States") and does not
recognize abbreviations like "CA" or "NYC".
"""

import re

# US state abbreviations → full names
US_STATE_ABBREVS: dict[str, str] = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}

# Country abbreviations → full names
COUNTRY_ABBREVS: dict[str, str] = {
    "US": "United States",
    "USA": "United States",
    "UK": "United Kingdom",
    "GB": "United Kingdom",
    "CA": "Canada",
    "AU": "Australia",
    "NZ": "New Zealand",
    "DE": "Germany",
    "FR": "France",
    "ES": "Spain",
    "IT": "Italy",
    "NL": "Netherlands",
    "SE": "Sweden",
    "NO": "Norway",
    "DK": "Denmark",
    "FI": "Finland",
    "IE": "Ireland",
    "SG": "Singapore",
    "JP": "Japan",
    "IN": "India",
    "BR": "Brazil",
    "MX": "Mexico",
    "IL": "Israel",
    "AE": "United Arab Emirates",
    "UAE": "United Arab Emirates",
}

# City aliases and common abbreviations
CITY_ALIASES: dict[str, str] = {
    "nyc": "New York",
    "sf": "San Francisco",
    "la": "Los Angeles",
    "dc": "Washington",
    "philly": "Philadelphia",
    "chi": "Chicago",
    "atl": "Atlanta",
    "dfw": "Dallas",
    "dmv": "Washington",
    "bay area": "San Francisco",
    "silicon valley": "San Jose",
}


def normalize_location(location: str) -> str:
    """Normalize a single location string.

    Handles:
    - City aliases ("NYC" → "New York")
    - "City, ST" patterns ("San Francisco, CA" → "San Francisco, California, United States")
    - Standalone state abbreviations ("CA" → "California, United States")
    - Country abbreviations ("UK" → "United Kingdom")
    - Pass-through for already-correct values
    """
    stripped = location.strip()
    if not stripped:
        return stripped

    # Check city aliases first (case-insensitive)
    lowered = stripped.lower()
    if lowered in CITY_ALIASES:
        return CITY_ALIASES[lowered]

    # Check "City, ST" pattern (2-letter state abbreviation after last comma)
    match = re.match(r"^(.+),\s*([A-Za-z]{2})$", stripped)
    if match:
        city = match.group(1).strip()
        abbr = match.group(2).upper()
        if abbr in US_STATE_ABBREVS:
            return f"{city}, {US_STATE_ABBREVS[abbr]}, United States"

    # Check standalone 2-3 letter abbreviations
    upper = stripped.upper()
    if len(stripped) <= 3:
        # Country abbreviations take priority for standalone short codes
        if upper in COUNTRY_ABBREVS:
            return COUNTRY_ABBREVS[upper]
        # Then check state abbreviations
        if upper in US_STATE_ABBREVS:
            return f"{US_STATE_ABBREVS[upper]}, United States"

    # Pass through — already a full name or unrecognized
    return stripped


def normalize_locations(locations: list[str]) -> list[str]:
    """Normalize a list of location strings."""
    result: list[str] = []
    for loc in locations:
        normalized = normalize_location(loc)
        if normalized:
            result.append(normalized)
    return result
