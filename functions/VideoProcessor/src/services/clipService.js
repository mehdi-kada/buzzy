import { ID } from 'node-appwrite';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { InputFile } from 'node-appwrite/file';
import { extractClip, extractClipWithSubtitles } from '../utils/ffmpeg.js';
import { filterTranscriptForClip, generateSubtitleFile, generateSubtitleFileWithSentiment } from '../utils/transcript.js';

export async function processClips(clipsData, transcriptDoc, videoDoc, tempVideoPath, clients, loggers) {
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

      // Process subtitles if transcript is available
      if (fullTranscript) {
        log(`Processing subtitles for clip ${i + 1}`);
        // Parse the full transcript first
        const parsedTranscript = JSON.parse(fullTranscript);
        log(`Parsed transcript with ${parsedTranscript.length} sentences`);
        
        // Filter transcript for this clip
        const clipSentences = filterTranscriptForClip(parsedTranscript, clip.start, clip.end);
        log(`Found ${clipSentences.length} sentences for this clip`);
        
        if (clipSentences.length > 0) {
          // Generate subtitle file
          subtitlePath = `/tmp/subtitle_${clipId}.srt`;
          tempFilesToCleanup.push(subtitlePath);
          log(`Generating subtitle file at ${subtitlePath}`);
          
          // Choose between regular subtitles or sentiment-enhanced
          const useSentimentStyling = false; // Set to true if you want sentiment features
          
          if (useSentimentStyling) {
            generateSubtitleFileWithSentiment(clipSentences, subtitlePath);
          } else {
            generateSubtitleFile(clipSentences, subtitlePath);
          }
          
          // Verify subtitle file exists and is readable
          if (!existsSync(subtitlePath)) {
            throw new Error(`Subtitle file was not created: ${subtitlePath}`);
          }
          
          // Log the subtitle content for debugging (first 500 chars)
          const subtitleContent = readFileSync(subtitlePath, 'utf8');
          log(`Subtitle content preview: ${subtitleContent.substring(0, 500)}...`);
  
          // Extract clip with burned-in subtitles
          log(`Extracting clip with subtitles: ${startTime}s to ${endTime}s`);
          await extractClipWithSubtitles(tempVideoPath, startTime, duration, subtitlePath, tempClipPath, useSentimentStyling);
          
          log(`Clip ${i + 1} processed with ${clipSentences.length} subtitle sentences`);
        } else {
          // No sentences in this clip, extract without subtitles
          await extractClip(tempVideoPath, startTime, duration, tempClipPath);
          log(`Clip ${i + 1} processed without subtitles (no sentences found)`);
        }
      } else {
        // No transcript available, extract without subtitles
        await extractClip(tempVideoPath, startTime, duration, tempClipPath);
        log(`Clip ${i + 1} processed without subtitles (no transcript)`);
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

export async function updateVideoWithClips(databases, config, videoId, clipIds) {
  return await databases.updateDocument(
    config.DATABASE_ID,
    config.VIDEOS_COLLECTION_ID,
    videoId,
    { clipIds }
  );
}
