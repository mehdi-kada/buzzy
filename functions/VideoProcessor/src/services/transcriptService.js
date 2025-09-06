import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function parseTimestampToMs(ts) {
  // "HH:MM:SS,mmm"
  const [hms, msStr] = ts.trim().split(",");
  const [hh, mm, ss] = hms.split(":").map(Number);
  return ((hh * 3600 + mm * 60 + ss) * 1000) + Number(msStr);
}

function msToTimestamp(ms) {
  const sign = ms < 0 ? "-" : "";
  ms = Math.max(0, ms); // clamp negative to 0 for SRT safety
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)},${String(millis).padStart(3, "0")}`;
}



function parseSrt(content) {
  // Split by blank lines (handles \r\n or \n)
  const blocks = content.split(/\r?\n\r?\n+/);
  const entries = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) continue;

    // First line may be index or sometimes omitted; be permissive
    let idx = Number(lines[0].trim());
    let timelineLine = "";
    let textStartIdx = 1;

    if (Number.isFinite(idx) && lines[1]?.includes("-->")) {
      timelineLine = lines[1].trim();
      textStartIdx = 2;
    } else if (lines[0]?.includes("-->")) {
      // No numeric index
      idx = entries.length + 1;
      timelineLine = lines[0].trim();
      textStartIdx = 1;
    } else {
      continue; // malformed
    }

    const [startStr, endStr] = timelineLine.split("-->").map(s => s.trim());
    if (!startStr || !endStr) continue;

    const start = parseTimestampToMs(startStr);
    const end = parseTimestampToMs(endStr);
    const textLines = lines.slice(textStartIdx);

    entries.push({ index: idx, start, end, textLines });
  }
  return entries;
}

function formatSrt(entries) {
  return entries
    .map((e, i) => {
      const idx = i + 1;
      const start = msToTimestamp(e.start);
      const end = msToTimestamp(e.end);
      const text = e.textLines.join("\n");
      return `${idx}\n${start} --> ${end}\n${text}`;
    })
    .join("\n\n");
}



function sliceSrtToWindow(
  entries,
  windowStartMs,
  windowEndMs,
  options = { shiftToZero: true, cropToWindow: true, minDurationMs: 1 }
) {
  const { shiftToZero, cropToWindow, minDurationMs } = options;
  console.log(`SliceSrtToWindow: window=${windowStartMs}-${windowEndMs}ms, entries=${entries.length}`);
  
  const overlapped = entries.filter(e => e.end > windowStartMs && e.start < windowEndMs);
  console.log(`Found ${overlapped.length} overlapping entries`);
  
  if (overlapped.length > 0) {
    console.log(`First overlapping entry: start=${overlapped[0].start}ms, end=${overlapped[0].end}ms`);
  }

  const sliced = overlapped
    .map(e => {
      let s = e.start;
      let t = e.end;

      if (cropToWindow) {
        s = Math.max(windowStartMs, e.start);
        t = Math.min(windowEndMs, e.end);
      }

      const duration = t - s;
      console.log(`Entry ${e.index}: original=${e.start}-${e.end}ms, cropped=${s}-${t}ms, duration=${duration}ms`);

      if (duration < minDurationMs) {
        console.log(`Dropping entry ${e.index}: duration ${duration}ms < minDuration ${minDurationMs}ms`);
        return null;
      }

      if (shiftToZero) {
        const o = windowStartMs;
        s = s - o;
        t = t - o;
      }

      return { index: e.index, start: s, end: t, textLines: e.textLines };
    })
    .filter((x) => !!x);

  console.log(`After filtering: ${sliced.length} entries remain`);

  // Reindex for SRT
  return sliced.map((e, i) => ({ ...e, index: i + 1 }));
}

// Function to get clip transcript data as structured array
export async function getClipTranscriptData(
  transcriptId,
  startMs,
  endMs,
  clients,
  loggers
) {
  const { storage, config } = clients;
  const { log, error } = loggers;

  try {
    if (startMs == null || endMs == null || endMs <= startMs) {
      throw new Error(`Invalid clip window: startMs=${startMs} endMs=${endMs}`);
    }

    log(`Downloading transcript file: ${transcriptId} from bucket: ${config.APPWRITE_TRANSCRIPT_BUCKET_ID}`);

    // 1) Download original transcript as Buffer from Appwrite Storage
    // Returns an ArrayBuffer when using Node SDK
    const arrayBuffer = await storage.getFileDownload(
      config.APPWRITE_TRANSCRIPT_BUCKET_ID,
      transcriptId
    ); // ArrayBuffer from Appwrite [10][7][16]

    // Convert ArrayBuffer to string properly
    const uint8Array = new Uint8Array(arrayBuffer);
    const srtContent = new TextDecoder().decode(uint8Array);
    log(`Downloaded SRT content length: ${srtContent.length} characters`);
    log(`SRT content preview: ${srtContent.substring(0, 200)}...`);

    // 2) Parse into entries
    const entries = parseSrt(srtContent);
    log(`Parsed ${entries.length} SRT entries from transcript`);
    
    if (entries.length > 0) {
      log(`First entry: start=${entries[0].start}ms, end=${entries[0].end}ms, text="${entries[0].textLines.join(' ')}"`);
      log(`Last entry: start=${entries[entries.length-1].start}ms, end=${entries[entries.length-1].end}ms`);
    }

    // 3) Slice to the desired window and shift timestamps so the clip starts at 0ms
    log(`Looking for entries between ${startMs}ms and ${endMs}ms`);
    
    // Debug: show overlapping entries before slicing
    const overlapped = entries.filter(e => e.end > startMs && e.start < endMs);
    log(`Found ${overlapped.length} overlapping entries before slicing`);
    
    const sliced = sliceSrtToWindow(entries, startMs, endMs, {
      shiftToZero: true,       // makes the timestamps relative to the clip
      cropToWindow: true,      // crop overlapping lines to the window bounds
      minDurationMs: 50        // drop extremely short fragments
    });

    log(`After slicing for window ${startMs}-${endMs}ms: ${sliced.length} entries`);

    // Return the sliced entries directly as structured data
    return sliced;
  } catch (err) {
    error(`Error in getClipTranscriptData: ${err.message}`);
    error(`Error stack: ${err.stack}`);
    throw err;
  }
}
