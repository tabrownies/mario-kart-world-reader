/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { parse, writeToPath } = require("fast-csv");

const app = express();
app.use(cors());
app.use(express.json());

// Resolve paths relative to where the script is located
// scratch/timothy/tools/single_frame_classifier/backend is 5 levels deep from workspace root
const WORKSPACE_ROOT = path.join(__dirname, "../../../../../");
const TRAINING_DATA_DIR = path.join(WORKSPACE_ROOT, "training_data");
const LABELS_DIR = path.join(TRAINING_DATA_DIR, "labels");
const FRAMES_DIR = path.join(TRAINING_DATA_DIR, "frames");

// Serve frames statically
app.use("/frames", express.static(FRAMES_DIR));

function getUnfinishedCsvPath() {
  if (!fs.existsSync(LABELS_DIR)) return null;
  const files = fs.readdirSync(LABELS_DIR);
  const unfinished = files.find((f) => f.includes("UNFINISHED") && f.endsWith(".csv"));
  return unfinished ? path.join(LABELS_DIR, unfinished) : null;
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });
}

function writeCsv(filePath, rows) {
  return new Promise((resolve, reject) => {
    writeToPath(filePath, rows, { headers: true })
      .on("finish", () => resolve())
      .on("error", reject);
  });
}

app.get("/api/frames", async (req, res) => {
  const filePath = getUnfinishedCsvPath();
  if (!filePath) {
    return res.json({ done: true, message: "No UNFINISHED CSV found in training_data/labels." });
  }

  try {
    const rows = await readCsv(filePath);
    const isAllDone =
      rows.length > 0 && rows.every((row) => !Object.values(row).some((val) => val === "unknown"));

    if (isAllDone) {
      const newPath = filePath.replace("UNFINISHED", "").replace("__", "_");
      fs.renameSync(filePath, newPath);
      return res.json({
        done: true,
        message: `All frames labeled! File renamed to ${path.basename(newPath)}.`,
      });
    }

    const frames = rows.map((row) => {
      const frame_id = row.frame_id;
      const runName = frame_id.split("_").slice(1).join("_").replace(".png", "");
      const isCompleted = !Object.values(row).some((val) => val === "unknown");
      return {
        frame_id,
        imageUrl: `/frames/${runName}/${frame_id}`,
        data: row,
        isCompleted,
      };
    });

    return res.json({ done: false, frames });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/save", async (req, res) => {
  const { frame_id, updatedData } = req.body;

  const filePath = getUnfinishedCsvPath();
  if (!filePath) return res.status(404).json({ error: "No UNFINISHED CSV found" });

  try {
    const rows = await readCsv(filePath);
    const rowIndex = rows.findIndex((r) => r.frame_id === frame_id);
    if (rowIndex === -1) return res.status(404).json({ error: "Frame not found in CSV" });

    // Update the row
    rows[rowIndex] = { ...rows[rowIndex], ...updatedData };
    await writeCsv(filePath, rows);

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
    console.log(`Looking for UNFINISHED CSVs in: ${LABELS_DIR}`);
  });
}

module.exports = app;
