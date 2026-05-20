#!/usr/bin/env python3
"""Unit tests for logical_data_filler_v1 heuristics."""

from logical_data_filler_v1 import (
    fill_race_phase_boundaries,
    interpolate_lap_count,
    interpolate_race_phase,
    is_unknown,
)


def test_is_unknown():
    assert is_unknown("")
    assert is_unknown("  ")
    assert is_unknown(None)
    assert not is_unknown("unknown")
    assert not is_unknown("lap_1")
    print("✓ test_is_unknown passed!")


def test_interpolate_race_phase():
    # Test identical bounds
    rows = [
        {"race_phase": "pre_countdown", "other": "x"},
        {"race_phase": "", "other": "x"},
        {"race_phase": "", "other": "x"},
        {"race_phase": "pre_countdown", "other": "x"},
    ]
    filled = interpolate_race_phase(rows)
    assert filled == 2
    assert rows[1]["race_phase"] == "pre_countdown"
    assert rows[2]["race_phase"] == "pre_countdown"
    assert rows[0]["other"] == "x"

    # Test different bounds (should NOT interpolate)
    rows2 = [
        {"race_phase": "pre_countdown"},
        {"race_phase": ""},
        {"race_phase": "racing"},
    ]
    filled2 = interpolate_race_phase(rows2)
    assert filled2 == 0
    assert rows2[1]["race_phase"] == ""
    print("✓ test_interpolate_race_phase passed!")


def test_interpolate_lap_count():
    # Test identical bounds
    rows = [
        {"lap_count": "lap_1", "other": "x"},
        {"lap_count": "", "other": "x"},
        {"lap_count": "", "other": "x"},
        {"lap_count": "lap_1", "other": "x"},
    ]
    filled = interpolate_lap_count(rows)
    assert filled == 2
    assert rows[1]["lap_count"] == "lap_1"
    assert rows[2]["lap_count"] == "lap_1"
    assert rows[0]["other"] == "x"

    # Test different bounds (should NOT interpolate)
    rows2 = [
        {"lap_count": "lap_1"},
        {"lap_count": ""},
        {"lap_count": "lap_2"},
    ]
    filled2 = interpolate_lap_count(rows2)
    assert filled2 == 0
    assert rows2[1]["lap_count"] == ""
    print("✓ test_interpolate_lap_count passed!")


def test_fill_race_phase_boundaries():
    # Test pre_countdown boundary
    rows = [
        {"race_phase": ""},
        {"race_phase": ""},
        {"race_phase": "pre_countdown"},
        {"race_phase": ""},
    ]
    filled = fill_race_phase_boundaries(rows)
    assert filled == 2
    assert rows[0]["race_phase"] == "pre_countdown"
    assert rows[1]["race_phase"] == "pre_countdown"
    assert rows[3]["race_phase"] == ""  # No trailing 'finished'

    # Test finished boundary
    rows2 = [
        {"race_phase": ""},
        {"race_phase": "finished"},
        {"race_phase": ""},
        {"race_phase": ""},
    ]
    filled2 = fill_race_phase_boundaries(rows2)
    assert filled2 == 2
    assert rows2[0]["race_phase"] == ""
    assert rows2[2]["race_phase"] == "finished"
    assert rows2[3]["race_phase"] == "finished"

    print("✓ test_fill_race_phase_boundaries passed!")


if __name__ == "__main__":
    test_is_unknown()
    test_interpolate_race_phase()
    test_interpolate_lap_count()
    test_fill_race_phase_boundaries()
    print("\nAll tests passed successfully!")
