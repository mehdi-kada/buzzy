import { ID } from 'node-appwrite';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { InputFile } from 'node-appwrite/file';
import { extractClip} from '../utils/ffmpeg.js';


export async function processClips(clipsData, transcriptDoc, tempVideoPath, clients, loggers) {
  const { databases, storage, config } = clients;
  const { log, error } = loggers;
  const processedClipIds = [];
  const tempFilesToCleanup = [];

  // Get full transcript if available
  let fullTranscript = null;
  if (transcriptDoc.sentimentAnalysis && transcriptDoc.sentimentAnalysis.trim() !== '') {
    try {
      fullTranscript = transcriptDoc.sentimentAnalysis;
      const parsedTranscript = JSON.parse(fullTranscript);
      log(`Found sentence-level transcript with ${parsedTranscript.length} sentences`);
    } catch (parseError) {
      error(`Failed to parse transcript: ${parseError.message}`);
      fullTranscript = null;
    }
  }

  for (let i = 0; i < clipsData.length; i++) {
    const clip = clipsData[i];
    const clipId = ID.unique();
    let tempClipPath = null;
    let subtitlePath = null;
    
    try {
      // Convert milliseconds to seconds for ffmpeg
      const startTime = clip.start / 1000;
      const endTime = clip.end / 1000;
      const duration = endTime - startTime;

      // Validate clip duration
      if (duration <= 0) {
        throw new Error(`Invalid clip duration: ${duration}s`);
      }

      // Generate clip filename with safe characters
      const safeFileName = `clip_${transcriptDoc.videoId}_${i + 1}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      const clipFileName = `${safeFileName}.mp4`;
      tempClipPath = `/tmp/${clipFileName}`;
      tempFilesToCleanup.push(tempClipPath);

        // No transcript available, extract without subtitles
        await extractClip(tempVideoPath, startTime, duration, tempClipPath);
        log(`Clip ${i + 1} processed without subtitles (no transcript)`);

      // Check if clip file was created successfully
      if (!existsSync(tempClipPath)) {
        throw new Error(`Clip file was not created: ${tempClipPath}`);
      }
      log(`Clip file created successfully: ${tempClipPath}`);

      // Read the clip file and upload to storage
      const clipFileBuffer = readFileSync(tempClipPath);
      log(`Clip file size: ${clipFileBuffer.length} bytes`);

      const clipFile = await storage.createFile(
        config.CLIPS_BUCKET_ID,
        clipId,
        InputFile.fromPath(tempClipPath, clipFileName)
      );

      // Create clip metadata document
      await databases.createDocument(
        config.DATABASE_ID,
        config.CLIPS_COLLECTION_ID,
        clipId,
        {
          userId: transcriptDoc.userId,
          videoId: transcriptDoc.videoId,
          fileName: clipFileName,
          startTime: clip.start,
          endTime: clip.end,
          duration: clip.end - clip.start,
          text: clip.text || '',
          sizeBytes: clipFileBuffer.length,
          mimeType: 'video/mp4',
          bucketFileId: clipFile.$id
        }
      );

      processedClipIds.push(clipId);
      log(`Clip ${i + 1} processed successfully: ${clipId}`);

    } catch (clipError) {
      error(`Failed to process clip ${i + 1}: ${clipError.message}`);
      error(`Error stack: ${clipError.stack}`);
      
      // Clean up any created files for this failed clip
      if (tempClipPath && existsSync(tempClipPath)) {
        try {
          unlinkSync(tempClipPath);
        } catch (cleanupError) {
          error(`Failed to cleanup failed clip file: ${cleanupError.message}`);
        }
      }
      
      // Continue with next clip even if this one fails
    } finally {
      // Clean up subtitle file if it exists
      if (subtitlePath && existsSync(subtitlePath)) {
        try {
          unlinkSync(subtitlePath);
        } catch (cleanupError) {
          error(`Failed to cleanup subtitle file: ${cleanupError.message}`);
        }
      }
      
      // Clean up temporary clip file if it still exists
      if (tempClipPath && existsSync(tempClipPath)) {
        try {
          unlinkSync(tempClipPath);
        } catch (cleanupError) {
          error(`Failed to cleanup clip file: ${cleanupError.message}`);
        }
      }
    }
  }

  // Final cleanup of any remaining temp files
  tempFilesToCleanup.forEach(filePath => {
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (cleanupError) {
        error(`Failed to cleanup temp file ${filePath}: ${cleanupError.message}`);
      }
    }
  });

  return processedClipIds;
}
