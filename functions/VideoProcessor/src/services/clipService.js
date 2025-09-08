import { ID } from 'node-appwrite';
import { existsSync, readFileSync, unlinkSync, rmSync, statSync } from 'fs';
import { InputFile } from 'node-appwrite/file';
import { extractClip, extractClipWithDrawtext } from '../utils/ffmpeg.js';
import { getClipTranscriptData } from './transcriptService.js';


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
    } catch (parseError) {
      error(`Failed to parse transcript: ${parseError.message}`);
      fullTranscript = null;
    }
  }

  for (let i = 0; i < clipsData.length; i++) {
    const clip = clipsData[i];
    const clipId = ID.unique();
    let tempClipPath = null;
    
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

      // Try to get clip transcript and burn subtitles
      try {
        if (transcriptDoc.transcriptFileId) {
          log(`Getting transcript data for clip ${i + 1} with transcriptFileId: ${transcriptDoc.transcriptFileId}`);
          // Get structured subtitle data instead of creating ASS file
          const subtitleData = await getClipTranscriptData(
            transcriptDoc.transcriptFileId,
            clip.start,
            clip.end,
            { storage, config },
            { log, error }
          );
          
          log(`Retrieved ${subtitleData.length} subtitle entries for clip ${i + 1}`);
          
          // Use the new drawtext approach
          await extractClipWithDrawtext(tempVideoPath, startTime, duration, tempClipPath, subtitleData);
          log(`Clip ${i + 1} processed with subtitles using drawtext`);
        } else {
          log(`No transcriptFileId found for video ${transcriptDoc.videoId}`);
          throw new Error('No transcriptFileId available');
        }
      } catch (transcriptError) {
        error(`Failed to get transcript for clip ${i + 1}: ${transcriptError.message}`);
        error(`Transcript error stack: ${transcriptError.stack}`);
        // Fallback to clip without subtitles
        await extractClip(tempVideoPath, startTime, duration, tempClipPath);
        log(`Clip ${i + 1} processed without subtitles (fallback)`);
      }

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
        // Check if it's a directory (temp dirs from transcript service)
        const stats = statSync(filePath);
        if (stats.isDirectory()) {
          rmSync(filePath, { recursive: true, force: true });
        } else {
          unlinkSync(filePath);
        }
      } catch (cleanupError) {
        error(`Failed to cleanup temp file/dir ${filePath}: ${cleanupError.message}`);
      }
    }
  });

  return processedClipIds;
}
