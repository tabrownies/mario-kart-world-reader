import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dotenv from 'dotenv';
import { 
  Confidence, 
  GetFrameClassificationResponse, 
  TelemetryGuess, 
  SaveFrameClassificationRequest,
  SaveFrameClassificationResponse,
  RaceMetadata,
  Track
} from './types_pb';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const BASE_DATA_DIR = process.env.BASE_DATA_DIR || path.join(__dirname, '../../data/runs');

app.use('/frames', express.static(BASE_DATA_DIR));

interface CSVRow {
  frame_id: string;
  track: string;
  placement: string;
  lap_count: string;
  coin_count: string;
  primary_item: string;
  secondary_item: string;
  race_phase: string;
}

const TRACK_MAP: Record<string, Track> = {
  'rainbow_road': Track.RAINBOW_ROAD,
  'unknown': Track.UNKNOWN
};

const TRACK_REVERSE_MAP: Record<number, string> = {
  [Track.RAINBOW_ROAD]: 'rainbow_road',
  [Track.UNKNOWN]: 'unknown'
};

function readCSV(runId: string): CSVRow[] {
  const csvPath = path.join(BASE_DATA_DIR, runId, `UNFINISHED_${runId}.csv`);
  if (!fs.existsSync(csvPath)) {
    const finishedPath = path.join(BASE_DATA_DIR, runId, `${runId}.csv`);
    if (fs.existsSync(finishedPath)) {
      return parse(fs.readFileSync(finishedPath, 'utf-8'), { columns: true });
    }
    return [];
  }
  return parse(fs.readFileSync(csvPath, 'utf-8'), { columns: true });
}

function writeCSV(runId: string, rows: CSVRow[]) {
  const csvPath = path.join(BASE_DATA_DIR, runId, `UNFINISHED_${runId}.csv`);
  fs.writeFileSync(csvPath, stringify(rows, { header: true }));
}

// ---------------------------------------------------------
// Pluggable Guessers
// ---------------------------------------------------------
export interface FrameGuesser {
  field: keyof CSVRow;
  guess(rows: CSVRow[], currentIndex: number): TelemetryGuess;
}

class TemporalGuesser implements FrameGuesser {
  constructor(public field: keyof CSVRow, private maxFrames: number, private caseName: "placement" | "lapCount" | "coinCount" | "item" | "racePhase" | "track") {}

  guess(rows: CSVRow[], currentIndex: number): TelemetryGuess {
    const val = rows[currentIndex][this.field];
    if (val) {
      const parsedVal = this.field === 'track' ? (TRACK_MAP[val] ?? Track.UNKNOWN) : (parseInt(val) || 0);
      return new TelemetryGuess({ confidence: Confidence.CERTAIN, value: { case: this.caseName, value: parsedVal } as any });
    }

    let match: string | null = null;
    let dist = Infinity;

    for (let i = currentIndex - 1; i >= 0 && (currentIndex - i) <= this.maxFrames; i--) {
      if (rows[i][this.field]) { match = rows[i][this.field]; dist = currentIndex - i; break; }
    }
    for (let i = currentIndex + 1; i < rows.length && (i - currentIndex) <= this.maxFrames; i++) {
      if (rows[i][this.field] && (i - currentIndex) < dist) { match = rows[i][this.field]; break; }
    }

    if (match) {
      const parsedMatch = this.field === 'track' ? (TRACK_MAP[match] ?? Track.UNKNOWN) : (parseInt(match) || 0);
      return new TelemetryGuess({ confidence: Confidence.UNCERTAIN, value: { case: this.caseName, value: parsedMatch } as any });
    }
    return new TelemetryGuess({ confidence: Confidence.UNKNOWN });
  }
}

class BasicGuesser implements FrameGuesser {
  constructor(public field: keyof CSVRow, private caseName: "placement" | "lapCount" | "coinCount" | "item" | "racePhase" | "track") {}
  guess(rows: CSVRow[], currentIndex: number): TelemetryGuess {
    const val = rows[currentIndex][this.field];
    if (val) {
      const parsedVal = this.field === 'track' ? (TRACK_MAP[val] ?? Track.UNKNOWN) : (parseInt(val) || 0);
      return new TelemetryGuess({ confidence: Confidence.CERTAIN, value: { case: this.caseName, value: parsedVal } as any });
    }
    return new TelemetryGuess({ confidence: Confidence.UNKNOWN });
  }
}

const guessers: FrameGuesser[] = [
  new TemporalGuesser('placement', 300, 'placement'),
  new TemporalGuesser('coin_count', 300, 'coinCount'),
  new BasicGuesser('lap_count', 'lapCount'),
  new BasicGuesser('primary_item', 'item'),
  new BasicGuesser('secondary_item', 'item'),
  new BasicGuesser('race_phase', 'racePhase'),
  new BasicGuesser('track', 'track')
];

// ---------------------------------------------------------
// Injectable Updaters
// ---------------------------------------------------------
interface FrameUpdater {
  field: keyof CSVRow;
  update(rows: CSVRow[], frameIndex: number, newValue: string): void;
}

class GlobalUpdater implements FrameUpdater {
  constructor(public field: keyof CSVRow) {}
  update(rows: CSVRow[], frameIndex: number, newValue: string) {
    if (!newValue) return;
    for (const row of rows) {
      row[this.field] = newValue;
    }
  }
}

class TransitionUpdater implements FrameUpdater {
  constructor(public field: keyof CSVRow) {}
  update(rows: CSVRow[], frameIndex: number, newValue: string) {
    if (!newValue) return;
    rows[frameIndex][this.field] = newValue;
    for (let i = frameIndex + 1; i < rows.length; i++) {
      if (rows[i][this.field] && rows[i][this.field] !== newValue) break;
      rows[i][this.field] = newValue;
    }
    for (let i = frameIndex - 1; i >= 0; i--) {
      if (rows[i][this.field] && rows[i][this.field] !== newValue) break;
      rows[i][this.field] = newValue;
    }
  }
}

class BasicUpdater implements FrameUpdater {
  constructor(public field: keyof CSVRow) {}
  update(rows: CSVRow[], frameIndex: number, newValue: string) {
    if (newValue !== undefined && newValue !== "") {
      rows[frameIndex][this.field] = newValue;
    }
  }
}

const updaters: FrameUpdater[] = [
  new GlobalUpdater('track'),
  new TransitionUpdater('lap_count'),
  new TransitionUpdater('race_phase'),
  new BasicUpdater('placement'),
  new BasicUpdater('coin_count'),
  new BasicUpdater('primary_item'),
  new BasicUpdater('secondary_item')
];

// ---------------------------------------------------------
// Endpoints
// ---------------------------------------------------------

app.get('/api/run/:runId/next', (req, res) => {
  const { runId } = req.params;
  const rows = readCSV(runId);
  
  let idx = rows.findIndex(r => !r.placement);
  if (idx === -1) idx = 0;
  
  if (rows.length === 0) return res.status(404).json({ error: "No frames found" });

  const row = rows[idx];
  
  const response = new GetFrameClassificationResponse({
    frameId: row.frame_id,
    imageUrl: `http://localhost:4000/frames/${runId}/${row.frame_id}`,
    metadata: new RaceMetadata({ track: TRACK_MAP[row.track] ?? Track.UNKNOWN, totalLaps: 3 }),
    placement: guessers.find(g => g.field === 'placement')?.guess(rows, idx),
    lapCount: guessers.find(g => g.field === 'lap_count')?.guess(rows, idx),
    coinCount: guessers.find(g => g.field === 'coin_count')?.guess(rows, idx),
    primaryItem: guessers.find(g => g.field === 'primary_item')?.guess(rows, idx),
    secondaryItem: guessers.find(g => g.field === 'secondary_item')?.guess(rows, idx),
    racePhase: guessers.find(g => g.field === 'race_phase')?.guess(rows, idx),
  });

  res.json(response.toJson());
});

app.post('/api/run/:runId/save', (req, res) => {
  const { runId } = req.params;
  const payload = req.body as Partial<SaveFrameClassificationRequest>;
  
  const rows = readCSV(runId);
  const idx = rows.findIndex(r => r.frame_id === payload.frameId);
  
  if (idx === -1) {
    return res.status(404).json({ error: "Frame not found" });
  }

  const trackStr = payload.track !== undefined ? TRACK_REVERSE_MAP[payload.track] : "";

  updaters.find(u => u.field === 'track')?.update(rows, idx, trackStr || "");
  updaters.find(u => u.field === 'placement')?.update(rows, idx, payload.placement ? String(payload.placement) : "");
  updaters.find(u => u.field === 'lap_count')?.update(rows, idx, payload.lapCount ? String(payload.lapCount) : "");
  updaters.find(u => u.field === 'coin_count')?.update(rows, idx, payload.coinCount !== undefined ? String(payload.coinCount) : "");
  updaters.find(u => u.field === 'primary_item')?.update(rows, idx, payload.primaryItem ? String(payload.primaryItem) : "");
  updaters.find(u => u.field === 'secondary_item')?.update(rows, idx, payload.secondaryItem ? String(payload.secondaryItem) : "");
  updaters.find(u => u.field === 'race_phase')?.update(rows, idx, payload.racePhase ? String(payload.racePhase) : "");

  writeCSV(runId, rows);
  
  const response = new SaveFrameClassificationResponse({ success: true });
  res.json(response.toJson());
});

app.listen(4000, () => {
  console.log('Backend listening on port 4000');
});
