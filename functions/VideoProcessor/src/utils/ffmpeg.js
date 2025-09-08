import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escapes text for the FFmpeg drawtext filter.
 * This is crucial to prevent errors when subtitles contain special characters.
 * @param {string} text - The text to be escaped.
 * @returns {string} The escaped text.
 */
function escapeDrawtext(text) {
  return text
    .replace(/\\/g, '\\\\\\\\') // Must be first
    .replace(/'/g, '’')       // Replace single quotes with a right single quote
    .replace(/:/g, '\\\\:')
    .replace(/%/g, '\\\\%')
    .replace(/,/g, '\\\\,');
}

// Function to extract a clip without subtitles (remains unchanged)
export async function extractClip(tempVideoPath, startTime, duration, tempClipPath) {
  // ... (no changes needed in this function)
  return new Promise((resolve, reject) => {
    let ffmpeg;
    const timeout = setTimeout(() => {
      if (ffmpeg) ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    ffmpeg = spawn(ffmpegStatic, [
      '-ss', startTime.toString(),
      '-i', tempVideoPath,
      '-t', duration.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-movflags', '+faststart',
      tempClipPath,
      '-y'
    ]);

    ffmpeg.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Updated function to extract clip with burned-in subtitles
export async function extractClipWithDrawtext(tempVideoPath, startTime, duration, tempClipPath, subtitleData) {
  return new Promise((resolve, reject) => {
    let ffmpeg;
    const timeout = setTimeout(() => {
      if (ffmpeg) ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    const fontPath = path.resolve(__dirname, '..', 'assets', 'fonts', 'DejaVuSans.ttf');
    if (!existsSync(fontPath)) {
      return reject(new Error(`Font file not found at path: ${fontPath}`));
    }

    const drawtextFilters = subtitleData.map(entry => {
      const startSeconds = entry.start / 1000;
      const endSeconds = entry.end / 1000;
      
      // Join multi-line text with a space and escape it
      const text = escapeDrawtext(entry.textLines.join(' '));
      
      const style = [
        `fontfile='${fontPath}'`,
        `text='${text}'`,
        `fontsize=22`,
        `fontcolor=white`,
        `box=1`, // Enable the background box
        `boxcolor=black@0.6`, // Black with 60% opacity
        `boxborderw=10`, // Padding around the text
        `x=(w-text_w)/2`, // Center horizontally
        `y=h-th-25`, // Position 25px from the bottom
        `enable='between(t,${startSeconds},${endSeconds})'`
      ].join(':');
      
      return `drawtext=${style}`;
    }).join(',');

    // Simplified argument list, as this function is only called when subtitles exist.
    const ffmpegArgs = [
      '-ss', startTime.toString(),
      '-i', tempVideoPath,
      '-t', duration.toString(),
      '-vf', drawtextFilters,
      '-c:a', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-movflags', '+faststart',
      tempClipPath,
      '-y'
    ];

    ffmpeg = spawn(ffmpegStatic, ffmpegArgs);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      clearTimeout(timeout);
      console.log('FFmpeg stderr:', stderr);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}. stderr: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`FFmpeg spawn error: ${err.message}. stderr: ${stderr}`));
    });
  });
}
