# Design: Mario Kart Logical Data Filler v1

## 1. Overview

In Mario Kart video datasets, labeling every single frame manually is time-consuming and prone to
gaps. However, because Mario Kart follows strict temporal constraints (e.g., race phases and lap
counts are monotonic and cannot transition backwards), we can write an automated script to fill in
the gaps (empty cells) in our label CSV files.

This design introduces a high-performance Python script, `logical_data_filler_v1.py`, located inside
the `scratch/timothy/tools/scripts/` directory.

---

## 2. Technical Decisions & Integration

### A. Python Language Selection

Python is the ideal language for this script because:

1. **Rich Tabular Utilities**: Python's standard `csv` module makes reading, writing, and parsing
   tabular data simple and safe.
2. **Jupyter Compatibility**: The logic can be easily imported or used in Jupyter notebooks for
   preprocessing pipelines.
3. **Protobuf & Translator Ecosystem**: We can directly load the central Protocol Buffers schema and
   the bidirectional enum translators to prevent string hardcoding.

### B. Dynamic Protobuf Bindings

Rather than hardcoding string representations of race phases (like `"pre_countdown"` and
`"finished"`), the script:

1. Adds the repo root directory to `sys.path`.
2. Imports `packages.types.python.generated.data_pb2` and
   `packages.types.python.translate_enums.enumTranslator`.
3. Resolves string constants dynamically:
   - `PRE_COUNTDOWN_STR = enumTranslator.racePhaseEnumToString(data_pb2.PRE_COUNTDOWN)`
   - `FINISHED_STR = enumTranslator.racePhaseEnumToString(data_pb2.FINISHED)`

---

## 3. Core Logic & Heuristics

The script processes **only** two columns: `race_phase` and `lap_count`. All other columns remain
untouched.

### Safe Gap Interpolation

For both `race_phase` and `lap_count` (which are monotonic and cannot go backwards):

- We scan the column to identify contiguous segments of unknown values.
- **Rule**: A cell is considered unknown **strictly** if it is an empty string `""` (or
  whitespaces). The literal string `"unknown"` is no longer treated as a gap.
- For each unknown segment, we look at the closest known value directly before it ($V_{left}$) and
  the closest known value directly after it ($V_{right}$).
- **Rule**: If $V_{left} == V_{right}$, we fill the entire segment of unknowns with that value.

Rather than running a generic parameterized function, the script separates these into two explicit,
dedicated functions:

- `interpolate_race_phase(rows)`
- `interpolate_lap_count(rows)`

### Boundary Filling for `race_phase`

The race phase has very predictable boundaries:

- **Pre-countdown Boundary**: If there is **ever** a known `pre_countdown` in the CSV, then
  **everything** before the _first_ known `pre_countdown` is filled with `pre_countdown`.
- **Finished Boundary**: If there is **ever** a known `finished` in the CSV, then **everything**
  after the _last_ known `finished` is filled with `finished`.

### Boundary Filling for `lap_count`

- Endings are ignored for now; we only perform standard in-between interpolation.

---

## 4. Command Line Interface (CLI) & Environment Integration

The script reads the `.env` file at the repository root to locate the labels directory
(`TRAINING_DATA_LABELS_DIRECTORY`).

The CLI takes only a filename:

```bash
python scratch/timothy/tools/scripts/logical_data_filler_v1.py \
    --file <csv_filename>
```

### Options:

- `--file` / `-f` (Required): Name of the CSV file inside the labels directory (e.g.,
  `UNFINISHED_mkw_rainbow_road...csv`). Absolute paths are not handled; the file is always resolved
  relative to the environment's labels folder.

---

## 5. Implementation Steps

1. **Environment Setup**: Read `.env` at the root and load the directory containing the labels.
2. **Drafting Script**: Implement the CSV reader, specialized column interpolation functions,
   dynamic Protobuf string resolutions, and a safe atomic writer (writes to a temporary file then
   replaces to prevent corruption).
3. **Validation**: Test the script on a test file.
4. **Formatting**: Format the script using Ruff and Prettier.
