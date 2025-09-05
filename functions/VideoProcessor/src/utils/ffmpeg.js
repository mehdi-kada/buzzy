import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Parse SRT content to extract subtitle data
function parseSRTContent(srtPath) {
  try {
    const content = readFileSync(srtPath, 'utf8')
      .replace(/\r/g, '') // remove Windows CRs
      .trim();
    const subtitles = [];
    const blocks = content.trim().split('\n\n');
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        const index = parseInt(lines[0]);
        const timeRange = lines[1];
        // Join remaining lines (multi-line subtitles) with spaces, collapse duplicate whitespace
        const text = lines
          .slice(2)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Parse time format: 00:00:00,000 --> 00:00:03,640
        const [startTime, endTime] = timeRange.split(' --> ');
        const startSeconds = parseTimeToSeconds(startTime);
        const endSeconds = parseTimeToSeconds(endTime);
        
        subtitles.push({
          index,
          startSeconds,
          endSeconds,
          text,
          duration: endSeconds - startSeconds
        });
      }
    }
    
    return subtitles;
  } catch (error) {
    console.error('Failed to parse SRT content:', error);
    return [];
  }
}

function parseTimeToSeconds(timeStr) {
  // Convert "00:00:03,640" to seconds
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
}

// Create drawtext filter chain for multiple subtitles
function createDrawtextFilter(subtitles, fontFile) {
  if (!subtitles || subtitles.length === 0) {
    return `drawtext=${fontFile ? `fontfile='${fontFile}':` : ''}text='No subtitles':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.5:boxborderw=5`;
  }

  const escape = (text) => {
    // More comprehensive escaping for FFmpeg
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/'/g, "'\\''")    // Escape single quotes properly for shell
      .replace(/:/g, '\\:')      // Escape colons
      .replace(/\n/g, ' ')         // Replace newlines with spaces
      .replace(/\r/g, ' ')         // Replace carriage returns with spaces
      .replace(/\[/g, '\\[')     // Escape brackets
      .replace(/\]/g, '\\]')     // Escape brackets
      .replace(/,/g, '\\,')      // Escape commas
      .replace(/;/g, '\\;')      // Escape semicolons
      .slice(0, 140);              // Limit length
  };

  // Build a drawtext filter per subtitle line.
  // (Multiple drawtext filters are concatenated with commas to form the filter chain.)
  const toFixed = (n) => {
    // Avoid extremely long binary float tails producing tokens FFmpeg misinterprets
    return Number(n).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  };

  const filters = subtitles.map(s => {
    const safe = escape(s.text);
    const start = toFixed(s.startSeconds < 0 ? 0 : s.startSeconds);
    // Ensure end > start minimally; if equal, extend by small epsilon
    let endVal = s.endSeconds;
    if (endVal <= s.startSeconds) endVal = s.startSeconds + 0.05;
    const end = toFixed(endVal);
    return `drawtext=${fontFile ? `fontfile='${fontFile}':` : ''}text='${safe}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.35:boxborderw=4:enable='between(t,${start},${end})'`;
  });

  return filters.join(',');
}

export async function extractClip(tempVideoPath, startTime, duration, tempClipPath) {
  return new Promise((resolve, reject) => {
    let ffmpeg; // declare beforehand to avoid TDZ in timeout
    const timeout = setTimeout(() => {
      if (ffmpeg) ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    ffmpeg = spawn(ffmpegStatic, [
      '-i', tempVideoPath,
      '-ss', startTime.toString(),
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

export async function extractClipWithSubtitles(tempVideoPath, startTime, duration, subtitlePath, tempClipPath, withSentimentColors = false) {
  return new Promise((resolve, reject) => {
  let ffmpeg; // will hold current ffmpeg process variant
    const timeout = setTimeout(() => {
      if (ffmpeg) ffmpeg.kill('SIGKILL');
      reject(new Error('FFmpeg process timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    const fontsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets', 'fonts');
    const candidateFonts = ['DejaVuSans.ttf', 'dejavu-sans.ttf', 'Arial.ttf'];
    let fontFile = null;
    for (const f of candidateFonts) {
      const fullPath = path.join(fontsDir, f);
      if (existsSync(fullPath)) { fontFile = fullPath; break; }
    }
    fontFile ? console.log(`Using bundled font for subtitles: ${fontFile}`) : console.log('No bundled font found; continuing.');

    let parsed = [];
    if (subtitlePath && existsSync(subtitlePath)) {
      parsed = parseSRTContent(subtitlePath);
      console.log(`Parsed ${parsed.length} subtitle lines (raw)`);
      parsed = parsed.filter(s => s.endSeconds >= 0 && s.startSeconds <= duration);
      console.log(`Filtered to ${parsed.length} lines within clip duration ${duration}s`);
    }

  let dynamicFilter = parsed.length ? createDrawtextFilter(parsed, fontFile) : null;
  let attemptedLibass = false;
  let attemptedWithoutSubtitles = false;

    const run = (args, label='primary') => {
      console.log(`Launching FFmpeg (${label}) args: ${args.join(' ')}`);
      const proc = spawn(ffmpegStatic, args);
      proc.stdout.on('data', d => console.log(`FFmpeg stdout (${label}): ${d}`));
      proc.stderr.on('data', d => console.log(`FFmpeg stderr (${label}): ${d}`));
      proc.on('error', err => { clearTimeout(timeout); reject(err); });
      proc.on('close', code => {
        console.log(`FFmpeg (${label}) exited with code ${code}`);
        if (code === 0) { clearTimeout(timeout); return resolve(); }
        // Failure handling chain
        if (label === 'libass' && dynamicFilter) {
          console.log('Native subtitles filter failed; trying drawtext chain.');
          return launchDrawtext();
        }
        if (label === 'drawtext' && !attemptedWithoutSubtitles) {
          attemptedWithoutSubtitles = true;
            console.log('Drawtext subtitles failed; retrying without any subtitles.');
            return launchNoSubs();
        }
        clearTimeout(timeout);
        reject(new Error(`FFmpeg (${label}) failed with code ${code}`));
      });
      return proc;
    };

    const launchLibass = () => {
      if (!(subtitlePath && existsSync(subtitlePath))) return launchDrawtext();
      attemptedLibass = true;
      const forceStyle = "FontName='DejaVu Sans',FontSize=24,Outline=0,BorderStyle=3,Shadow=0,Alignment=2,MarginV=60";
      const srtEscaped = subtitlePath.replace(/'/g, "\\'");
      const filter = `subtitles='${srtEscaped}':force_style='${forceStyle}'`;
      const args = [
        '-y',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', tempVideoPath,
        '-vf', filter,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-movflags', '+faststart',
        tempClipPath
      ];
      console.log('Attempting native subtitles (libass) method.');
      ffmpeg = run(args, 'libass');
    };

    const launchDrawtext = () => {
      const filter = dynamicFilter || `drawtext=${fontFile ? `fontfile='${fontFile}':` : ''}text=' ':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-60`;
      console.log(`Using drawtext method with chain length ${filter.split('drawtext').length - 1}`);
      console.log(`Filter preview (first 400 chars): ${filter.slice(0,400)}`);
      const args = [
        '-i', tempVideoPath,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-vf', filter,
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-movflags', '+faststart',
        tempClipPath,
        '-y'
      ];
      ffmpeg = run(args, 'drawtext');
    };

    const launchNoSubs = () => {
      const args = [
        '-i', tempVideoPath,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c:a', 'copy',
        '-c:v', 'libx264',
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-movflags', '+faststart',
        tempClipPath,
        '-y'
      ];
      ffmpeg = run(args, 'no-subs');
    };

    if (parsed.length) launchLibass(); else launchDrawtext();
  });
}
