# Design: Simple Single Frame Classifier v1

## 1. Overview

A straightforward, no-shortcuts single-frame labeling tool designed to complete `UNFINISHED`
training data CSVs. It consists of a static Next.js frontend and a local Express backend.

## 2. Architecture

- **Frontend**: Next.js (Static Export). A simple, fast UI that communicates with the backend via
  REST APIs. Displays the frame image, pre-fills any existing data, and provides a hardcoded form to
  complete the classifications.
- **Backend**: Express.js server running locally. Handles file system operations, specifically
  reading from and writing to the `training` folder.

## 3. Core Workflow

1. **File Discovery**: On startup, the Express backend scans the `training_data/labels` directory
   for a CSV file containing `UNFINISHED` in its filename.
2. **Frame Retrieval (`GET /api/next`)**:
   - The backend parses the CSV and identifies the first frame that is not 100% complete (contains
     `unknown` values).
   - It sends the image path and any partially filled data for that frame to the frontend.
3. **User Interaction**:
   - The frontend displays the frame.
   - If partial data exists, it is automatically pre-filled in the form.
   - The user fills in the remaining fields manually via standard UI inputs (no keyboard shortcuts).
   - The form is hardcoded to ask specifically for the 7 fields defined in `data.proto`: `track`,
     `race_phase`, `lap_count`, `placement`, `coin_count`, `primary_item`, and `secondary_item`.
4. **Data Saving (`POST /api/save`)**:
   - The backend receives the full classification data for the frame.
   - It updates the specific row in the `UNFINISHED` CSV and immediately saves the file to disk.
5. **Completion**:
   - The frontend requests the next frame.
   - If the backend detects that all rows in the CSV are now completely filled, it renames the file
     to remove the `UNFINISHED` tag, marking it as done.

## 4. Key Characteristics

- **Dumb & Direct**: No complex batching or background classification loops. It strictly serves one
  frame, waits for human input, saves, and repeats.
- **Partial Data Support**: Leverages any existing data in the CSV to speed up manual labeling,
  while still enforcing that every frame is fully validated before moving on.
- **Real-time Persistence**: Every submission immediately updates the CSV file, preventing data
  loss.
- **Hardcoded Schema**: The UI will not dynamically read Protobufs. It will have exactly 7 inputs
  matching the required fields.
- **Basic Baseline UI**: No keyboard shortcuts to start. Strictly point, click, and submit to
  maintain simplicity.

## 5. Proposed Tech Stack

- **Frontend**: Next.js (React), standard Vanilla CSS (No Tailwind). Exported statically.
- **Backend**: Node.js, Express, `fast-csv` for reading/writing the CSV files.
