#!/usr/bin/env python3
"""Mario Kart Logical Data Filler v1

This script fills in missing values (empty cells) in the 'race_phase' and 'lap_count'
columns of labeled CSV files using temporal interpolation and game heuristics.
"""

import argparse
import csv
import os
import sys
import tempfile

from dotenv import find_dotenv, load_dotenv

# Resolve repository root using find_dotenv
dotenv_file = find_dotenv()
if dotenv_file:
    repo_root = os.path.dirname(os.path.abspath(dotenv_file))
else:
    # Fallback to relative path if no .env file exists
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))

if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

import packages.types.python.generated.data_pb2 as data_pb2  # noqa: E402
from packages.types.python.translate_enums import enumTranslator  # noqa: E402

# Retrieve strict string values from our Protobuf enum definition
PRE_COUNTDOWN_STR = enumTranslator.racePhaseEnumToString(data_pb2.PRE_COUNTDOWN)
FINISHED_STR = enumTranslator.racePhaseEnumToString(data_pb2.FINISHED)


def is_unknown(val):
    """Determine if a CSV cell value represents an empty/unknown state."""
    return not val or val.strip() == ""


def interpolate_race_phase(rows):
    """Interpolate race_phase where V_left == V_right.

    Because the race phase is strictly monotonic (cannot go backwards), if the phase
    immediately before a gap and immediately after a gap are identical, every frame
    within that gap must share that exact same phase.
    """
    n = len(rows)
    filled_count = 0
    gap_start = None

    for i in range(n):
        if is_unknown(rows[i]["race_phase"]):
            # If we just entered a segment of unknowns, record the start index of the first unknown
            if gap_start is None:
                gap_start = i
        else:
            # We hit a known value. If we were tracking an active gap, process it.
            if gap_start is not None:
                # If the gap starts at the very beginning of the array, we have no left boundary
                if gap_start == 0:
                    gap_start = None
                    continue

                # Get the bounding values
                left_val = rows[gap_start - 1]["race_phase"]
                right_val = rows[i]["race_phase"]

                # If bounding values on both sides of the gap are identical, fill it
                if left_val.strip() == right_val.strip():
                    fill_value = left_val.strip()
                    for k in range(gap_start, i):
                        rows[k]["race_phase"] = fill_value
                    filled_count += i - gap_start

                # Reset gap tracker
                gap_start = None

    return filled_count


def interpolate_lap_count(rows):
    """Interpolate lap_count where V_left == V_right.

    Because lap counts are strictly monotonic (cannot decrease), if the lap count
    immediately before a gap and immediately after a gap are identical, every frame
    within that gap must share that exact same lap count.
    """
    n = len(rows)
    filled_count = 0
    gap_start = None

    for i in range(n):
        if is_unknown(rows[i]["lap_count"]):
            # If we just entered a segment of unknowns, record the start index
            if gap_start is None:
                gap_start = i
        else:
            # We hit a known value. If we were tracking an active gap, process it.
            if gap_start is not None:
                # If the gap starts at the very beginning of the array, we have no left boundary
                if gap_start == 0:
                    gap_start = None
                    continue

                # Get the bounding values
                left_val = rows[gap_start - 1]["lap_count"]
                right_val = rows[i]["lap_count"]

                # If bounding values on both sides of the gap are identical, fill it
                if left_val.strip() == right_val.strip():
                    fill_value = left_val.strip()
                    for k in range(gap_start, i):
                        rows[k]["lap_count"] = fill_value
                    filled_count += i - gap_start

                # Reset gap tracker
                gap_start = None

    return filled_count


def fill_race_phase_boundaries(rows):
    """Specific boundary filling for 'race_phase' using strings from Protobuf.

    - Everything before the first 'pre_countdown' is filled with 'pre_countdown'.
    - Everything after the last 'finished' is filled with 'finished'.
    """
    n = len(rows)

    # 1. Find first pre_countdown
    first_pre_countdown_idx = -1
    for idx, row in enumerate(rows):
        if row.get("race_phase", "").strip() == PRE_COUNTDOWN_STR:
            first_pre_countdown_idx = idx
            break

    pre_countdown_filled = 0
    if first_pre_countdown_idx > 0:
        for idx in range(first_pre_countdown_idx):
            if is_unknown(rows[idx].get("race_phase")):
                rows[idx]["race_phase"] = PRE_COUNTDOWN_STR
                pre_countdown_filled += 1

    # 2. Find last finished
    last_finished_idx = -1
    for idx in range(n - 1, -1, -1):
        if rows[idx].get("race_phase", "").strip() == FINISHED_STR:
            last_finished_idx = idx
            break

    finished_filled = 0
    if last_finished_idx != -1 and last_finished_idx < n - 1:
        for idx in range(last_finished_idx + 1, n):
            if is_unknown(rows[idx].get("race_phase")):
                rows[idx]["race_phase"] = FINISHED_STR
                finished_filled += 1

    return pre_countdown_filled + finished_filled


def save_csv_safely(file_path, fieldnames, rows):
    """Write rows to a temporary file first, then atomically rename to target."""
    temp_fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(file_path), suffix=".tmp")
    try:
        with os.fdopen(temp_fd, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temp_path, file_path)
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise e


def main():
    # Parse CLI Arguments
    parser = argparse.ArgumentParser(
        description="Mario Kart temporal label filler for 'race_phase' and 'lap_count'."
    )
    parser.add_argument(
        "--file",
        "-f",
        required=True,
        help="CSV filename inside the labels directory",
    )
    args = parser.parse_args()

    # Load environment variables cleanly using python-dotenv
    load_dotenv(dotenv_file)
    labels_dir_rel = os.getenv("TRAINING_DATA_LABELS_DIRECTORY", "training_data/labels")
    labels_dir = (
        labels_dir_rel
        if os.path.isabs(labels_dir_rel)
        else os.path.abspath(os.path.join(repo_root, labels_dir_rel))
    )

    # Resolve input CSV file path inside the labels directory directly
    csv_path = os.path.join(labels_dir, args.file)

    if not os.path.exists(csv_path):
        print(f"Error: Target file not found at {csv_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Processing label file: {csv_path}")

    # Read the CSV rows
    rows = []
    fieldnames = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    if not rows:
        print("Warning: CSV file is empty.", file=sys.stderr)
        sys.exit(0)

    # Validate essential columns exist
    for col in ["race_phase", "lap_count"]:
        if col not in fieldnames:
            print(
                f"Error: Required column '{col}' is missing from the CSV headers.",
                file=sys.stderr,
            )
            sys.exit(1)

    # Run boundary filling for race_phase
    print("Applying heuristics...")
    phase_boundary_filled = fill_race_phase_boundaries(rows)

    # Run standard interpolation for both columns
    phase_interp_filled = interpolate_race_phase(rows)
    lap_interp_filled = interpolate_lap_count(rows)

    total_phase = phase_boundary_filled + phase_interp_filled
    total_lap = lap_interp_filled

    print("\nFilling Statistics:")
    print(f"  'race_phase' filled: {total_phase} frames")
    print(f"    - Boundaries: {phase_boundary_filled}")
    print(f"    - Interpolated: {phase_interp_filled}")
    print(f"  'lap_count' filled: {total_lap} frames")
    print(f"    - Interpolated: {lap_interp_filled}")

    print(f"\nSaving updated label data in-place: {csv_path}")
    save_csv_safely(csv_path, fieldnames, rows)
    print("Save completed successfully.")


if __name__ == "__main__":
    main()
