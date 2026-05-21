const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parse, writeToPath } = require('fast-csv');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Resolve paths relative to workspace root (5 levels up from backend folder)
const WORKSPACE_ROOT = path.join(__dirname, '../../../../../');
const TRAINING_DATA_DIR = path.join(WORKSPACE_ROOT, 'training_data');
const LABELS_DIR = path.join(TRAINING_DATA_DIR, 'labels');
const FRAMES_DIR = path.join(TRAINING_DATA_DIR, 'frames');

// Serve gameplay frames statically
app.use('/frames', express.static(FRAMES_DIR));

function getUnfinishedCsvPath() {
    if (!fs.existsSync(LABELS_DIR)) return null;
    const files = fs.readdirSync(LABELS_DIR);
    const unfinished = files.find(f => f.includes('UNFINISHED') && f.endsWith('.csv'));
    return unfinished ? path.join(LABELS_DIR, unfinished) : null;
}

function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(parse({ headers: true }))
            .on('data', row => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', error => reject(error));
    });
}

function writeCsv(filePath, rows) {
    return new Promise((resolve, reject) => {
        writeToPath(filePath, rows, { headers: true })
            .on('finish', () => resolve())
            .on('error', reject);
    });
}

// REST API to load the active CSV file and extract existing transitions
app.get('/api/load', async (req, res) => {
    const filePath = getUnfinishedCsvPath();
    if (!filePath) {
        return res.json({ success: false, message: "No active UNFINISHED CSV found in training_data/labels." });
    }

    try {
        const rows = await readCsv(filePath);
        if (rows.length === 0) {
            return res.json({ success: false, message: "Active CSV file is empty." });
        }

        const totalFrames = rows.length;
        const csvFilename = path.basename(filePath);

        // Frame IDs and folder resolution
        const frameIds = rows.map(r => r.frame_id);
        const firstFrameId = frameIds[0];
        const runFolder = firstFrameId.split('_').slice(1).join('_').replace('.png', '');

        // Map columns for client display
        const imageUrls = frameIds.map(fid => `/frames/${runFolder}/${fid}`);

        // Scan columns for transition boundaries
        const columns = ['placement', 'coin_count', 'primary_item', 'secondary_item'];
        const transitions = {
            placement: [],
            coin_count: [],
            primary_item: [],
            secondary_item: []
        };

        const unknownMap = {
            placement: 'place_unknown',
            coin_count: 'coin_unknown',
            primary_item: 'item_unknown',
            secondary_item: 'item_unknown'
        };

        columns.forEach(col => {
            let previousVal = null;
            const defaultUnknown = unknownMap[col];

            rows.forEach((row, idx) => {
                const val = row[col];
                const isValid = val && val !== 'unknown' && val !== defaultUnknown;

                if (isValid) {
                    if (val !== previousVal) {
                        transitions[col].push({ frameIdx: idx, val });
                        previousVal = val;
                    }
                } else if (previousVal !== null) {
                    // Transition boundary back to unknown state
                    transitions[col].push({ frameIdx: idx, val: 'unknown' });
                    previousVal = null;
                }
            });
        });

        // Identify resume index (first unknown entry)
        const resumeFrameIndex = {
            placement: rows.findIndex(r => !r.placement || r.placement.includes('unknown')),
            coin_count: rows.findIndex(r => !r.coin_count || r.coin_count.includes('unknown')),
            primary_item: rows.findIndex(r => !r.primary_item || r.primary_item.includes('unknown')),
            secondary_item: rows.findIndex(r => !r.secondary_item || r.secondary_item.includes('unknown'))
        };

        Object.keys(resumeFrameIndex).forEach(key => {
            if (resumeFrameIndex[key] === -1) resumeFrameIndex[key] = 0;
        });

        res.json({
            success: true,
            csvFilename,
            totalFrames,
            imageUrls,
            frameIds,
            transitions,
            resumeFrameIndex
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// REST API to write transition changes to CSV and run forward-fill
app.post('/api/save', async (req, res) => {
    const { columnName, transitions } = req.body;

    if (!['placement', 'coin_count', 'primary_item', 'secondary_item'].includes(columnName)) {
        return res.status(400).json({ error: "Invalid column name" });
    }

    const filePath = getUnfinishedCsvPath();
    if (!filePath) {
        return res.status(404).json({ error: "No active UNFINISHED CSV found" });
    }

    try {
        const rows = await readCsv(filePath);

        // Sort transitions by frameIdx
        const sorted = [...transitions].sort((a, b) => a.frameIdx - b.frameIdx);

        const unknownMap = {
            placement: 'place_unknown',
            coin_count: 'coin_unknown',
            primary_item: 'item_unknown',
            secondary_item: 'item_unknown'
        };
        const defaultUnknown = unknownMap[columnName];

        // Initialize all frames in the column back to default empty/unknown values
        for (let i = 0; i < rows.length; i++) {
            rows[i][columnName] = (i === 0 || i === 1) ? defaultUnknown : '';
        }

        // Apply bounded interpolation between keyframes
        for (let k = 0; k < sorted.length; k++) {
            const startIdx = sorted[k].frameIdx;
            const startVal = sorted[k].val;

            // Bounded: If it is the last keyframe, we ONLY fill that single frame.
            // Otherwise, we interpolate from startIdx up to the next keyframe's frameIdx - 1.
            const endIdx = (k < sorted.length - 1) ? sorted[k + 1].frameIdx - 1 : startIdx;

            const fillVal = (startVal === 'unknown') ? '' : startVal;
            for (let i = startIdx; i <= endIdx; i++) {
                if (fillVal === '') {
                    rows[i][columnName] = (i === 0 || i === 1) ? defaultUnknown : '';
                } else {
                    rows[i][columnName] = fillVal;
                }
            }
        }

        // Save back to disk
        await writeCsv(filePath, rows);
        res.json({ success: true, message: `Successfully saved and forward-filled column [${columnName}]` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3003; // Dedicated transition labeler backend port
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Looking for UNFINISHED CSVs in: ${LABELS_DIR}`);
});
