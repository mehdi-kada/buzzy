import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { readFileSync, existsSync } from 'fs';
import path from 'path';



export async function extractClip(tempVideoPath, startTime, duration, tempClipPath) {
  return new Promise((resolve, reject) => {
    let ffmpeg; // declare beforehand to avoid TDZ in timeout
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

