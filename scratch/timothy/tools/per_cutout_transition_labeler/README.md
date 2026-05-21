# Per-Cutout Transition Labeler v1

A premium, event-based data labeling tool for Mario Kart World dataset annotation, built with **Next.js** and **Express**.

Instead of labeling every single frame sequentially, this tool enables labeling only **transition frame boundaries** per visual cutout area. The values are automatically **forward-filled (interpolated)** across intermediate frames, reducing human data labeling time by over **99.5%**.

## Directory Structure

```
per_cutout_transition_labeler/
├── package.json         # Root configurations running concurrently
├── README.md
├── backend/
│   ├── package.json
│   └── index.js         # Express local server querying CSV and running FFill
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts   # Output: export settings
    └── src/
        └── app/
            ├── layout.tsx
            ├── globals.css
            └── page.tsx # Core annotation interface
```

## Key Features

- **Sequential Visual Phases**: Works one data point at a time to reduce cognitive load:
  1. **Placement**
  2. **Coin Count**
  3. **Primary Item / Item 1**
  4. **Secondary Item / Item 2**
- **Dynamic CSS Cropping**: The display automatically focuses and zooms on the target HUD area without altering files on disk.
- **Adjustable Crop Sliders**: fine-tune crop positions inside the browser, saved dynamically in `localStorage` per phase.
- **Mid-Flight Preservations (Save-As-We-Go)**: State is instantly saved to disk and forward-filled. Opening a CSV will automatically reconstruct marked keyframes and seek to your first unfinished index, letting you pick up exactly where you left off.
- **Fast Timeline Scrubbing**: Frame playbacks, keyboard arrows, and quick numerical bindings (0-9) make entering classifications extremely rapid.

## Setup & Running

1. **Install all dependencies** (for root, frontend, and backend):
   ```bash
   cd scratch/timothy/tools/per_cutout_transition_labeler
   npm run install-all
   ```

2. **Start both servers concurrently**:
   ```bash
   npm run dev
   ```

3. **Open application**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.
