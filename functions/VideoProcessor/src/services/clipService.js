import { ID } from 'node-appwrite';
import { existsSync, readFileSync, unlinkSync, rmSync, statSync } from 'fs';
import { InputFile } from 'node-appwrite/file';
import { extractClip, extractClipWithDrawtext, generateThumbnail } from '../utils/ffmpeg.js';
import { getClipTranscriptData } from './transcriptService.js';


export async function processClips(clipsData, transcriptDoc, tempVideoPath, videoDimensions, clients, loggers) {
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
    let tempThumbnailPath = null;
    
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
          const subtitleData = await getClipTranscriptData(
            transcriptDoc.transcriptFileId,
            clip.start,
            clip.end,
            { storage, config },
            { log, error }
          );
          
          log(`Retrieved ${subtitleData.length} subtitle entries for clip ${i + 1}`);
          
          await extractClipWithDrawtext(tempVideoPath, startTime, duration, tempClipPath, subtitleData, videoDimensions);
          log(`Clip ${i + 1} processed with subtitles using drawtext`);
        } else {
          log(`No transcriptFileId found for video ${transcriptDoc.videoId}`);
          throw new Error('No transcriptFileId available');
        }
      } catch (transcriptError) {
        error(`Failed to get transcript for clip ${i + 1}: ${transcriptError.message}`);
        error(`Transcript error stack: ${transcriptError.stack}`);
        await extractClip(tempVideoPath, startTime, duration, tempClipPath);
        log(`Clip ${i + 1} processed without subtitles (fallback)`);
      }

      if (!existsSync(tempClipPath)) {
        throw new Error(`Clip file was not created: ${tempClipPath}`);
      }
      log(`Clip file created successfully: ${tempClipPath}`);

      // Generate thumbnail for the clip
      let thumbnailFileId = null;
      try {
        const thumbnailFileName = `thumb_${safeFileName}.jpg`;
        tempThumbnailPath = `/tmp/${thumbnailFileName}`;
        tempFilesToCleanup.push(tempThumbnailPath);
        await generateThumbnail(tempClipPath, tempThumbnailPath, '00:00:01.000');
        // Log bucket id used so missing/misconfigured buckets are obvious in logs
        log(`Uploading thumbnail to bucket: ${config.THUMBNAILS_BUCKET_ID}`);
        const thumbnailFile = await storage.createFile(
          config.THUMBNAILS_BUCKET_ID,
          ID.unique(),
          InputFile.fromPath(tempThumbnailPath, thumbnailFileName)
        );
        if (!thumbnailFile || !thumbnailFile.$id) throw new Error('Thumbnail upload did not return a file id');
        thumbnailFileId = thumbnailFile.$id;
      } catch (thumbError) {
        error(`Failed to generate thumbnail for clip ${i + 1}: ${thumbError.message}`);
      }

      // Upload clip video
      log(`Uploading clip to bucket: ${config.CLIPS_BUCKET_ID}`);
      const clipFile = await storage.createFile(
        config.CLIPS_BUCKET_ID,
        clipId,
        InputFile.fromPath(tempClipPath, clipFileName)
      );
      if (!clipFile || !clipFile.$id) throw new Error('Clip upload did not return a file id');

      // Create clip metadata document
      const clipDocument = {
        userId: transcriptDoc.userId,
        videoId: transcriptDoc.videoId,
        fileName: clipFileName,
        startTime: clip.start,
        endTime: clip.end,
        duration: clip.end - clip.start,
        text: clip.text || '',
        sizeBytes: statSync(tempClipPath).size,
        mimeType: 'video/mp4',
        bucketFileId: clipFile.$id,
      };

      if (thumbnailFileId) {
        clipDocument.thumbnailFileId = thumbnailFileId;
      }

      await databases.createDocument(
        config.DATABASE_ID,
        config.CLIPS_COLLECTION_ID,
        clipId,
        clipDocument
      );

      processedClipIds.push(clipId);
      log(`Clip ${i + 1} processed successfully: ${clipId}`);

    } catch (clipError) {
      error(`Failed to process clip ${i + 1}: ${clipError.message}`);
      error(`Error stack: ${clipError.stack}`);
      
    } finally {
      // Clean up temporary files for this clip iteration
      if (tempClipPath && existsSync(tempClipPath)) {
        try { unlinkSync(tempClipPath); } catch (e) { error(`Cleanup failed for ${tempClipPath}: ${e.message}`); }
      }
      if (tempThumbnailPath && existsSync(tempThumbnailPath)) {
        try { unlinkSync(tempThumbnailPath); } catch (e) { error(`Cleanup failed for ${tempThumbnailPath}: ${e.message}`); }
      }
    }
  }

  return processedClipIds;
}
