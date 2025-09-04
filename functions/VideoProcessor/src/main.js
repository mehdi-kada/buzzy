import { Client, Databases, Storage, ID } from 'node-appwrite';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import ffmpegStatic from 'ffmpeg-static';

// This Appwrite function processes video clips based on transcript timestamps
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY || req.headers['x-appwrite-key'] || '');

  const databases = new Databases(client);
  const storage = new Storage(client);
  
  const DATABASE_ID = '68b2d533003210de565e';
  const VIDEOS_COLLECTION_ID = 'videos';
  const TRANSCRIPTS_COLLECTION_ID = 'transcripts';
  const CLIPS_COLLECTION_ID = 'clips';
  const CLIPS_BUCKET_ID = 'clips';

  try {
    // Handle ping requests
    if (req.path === "/ping") {
      return res.text("Pong");
    }

    // Process the request payload - expecting transcript document creation event
    let payload;
    if (typeof req.body === 'string') {
      try {
        payload = JSON.parse(req.body);
      } catch (parseError) {
        error(`Failed to parse request body: ${parseError.message}`);
        return res.json({ success: false, message: 'Invalid JSON in request body' });
      }
    } else {
      // req.body is already an object (common with Appwrite events)
      payload = req.body || req;
    }
    
    log(`Received payload type: ${typeof payload}`);
    log(`Payload keys: ${Object.keys(payload || {}).join(', ')}`);

    // Extract document data from the event
    let transcriptDoc;
    if (payload && payload.$id) {
      // Direct document data
      transcriptDoc = payload;
      log('Found direct document data in payload');
    } else if (payload && payload.document) {
      // Event wrapper
      transcriptDoc = payload.document;
      log('Found document data in payload.document');
    } else {
      log('No valid document found in payload');
      log(`Available payload structure: ${JSON.stringify(payload, null, 2)}`);
      return res.json({ success: false, message: 'No document found' });
    }

    // Check if clipsTimestamps exists and is not empty
    if (!transcriptDoc.clipsTimestamps || transcriptDoc.clipsTimestamps.trim() === '') {
      log('No clips timestamps found in transcript document');
      log(`Document structure: ${JSON.stringify(transcriptDoc, null, 2)}`);
      return res.json({ success: false, message: 'No clips timestamps to process' });
    }

    log(`Found clipsTimestamps: ${transcriptDoc.clipsTimestamps}`);

    // Parse the clips timestamps
    let clipsData;
    try {
      if (typeof transcriptDoc.clipsTimestamps === 'string') {
        clipsData = JSON.parse(transcriptDoc.clipsTimestamps);
      } else {
        // Already an object/array
        clipsData = transcriptDoc.clipsTimestamps;
      }
      
      if (!Array.isArray(clipsData)) {
        throw new Error('clipsTimestamps must be an array');
      }
      
    } catch (parseError) {
      error(`Failed to parse clipsTimestamps: ${parseError.message}`);
      error(`clipsTimestamps content: ${transcriptDoc.clipsTimestamps}`);
      error(`clipsTimestamps type: ${typeof transcriptDoc.clipsTimestamps}`);
      return res.json({ success: false, message: 'Invalid clips timestamps format' });
    }

    log(`Processing ${clipsData.length} clips for video ${transcriptDoc.videoId}`);

    // Validate clips data format
    for (let i = 0; i < clipsData.length; i++) {
      const clip = clipsData[i];
      if (!clip.startTime || !clip.endTime || !clip.title) {
        error(`Invalid clip format at index ${i}: ${JSON.stringify(clip)}`);
        return res.json({ 
          success: false, 
          message: `Invalid clip format at index ${i}. Required fields: startTime, endTime, title` 
        });
      }
      
      // Validate time format (should be in seconds or HH:MM:SS)
      if (typeof clip.startTime !== 'number' && typeof clip.startTime !== 'string') {
        error(`Invalid startTime format at index ${i}: ${clip.startTime}`);
        return res.json({ 
          success: false, 
          message: `Invalid startTime format at index ${i}` 
        });
      }
      
      if (typeof clip.endTime !== 'number' && typeof clip.endTime !== 'string') {
        error(`Invalid endTime format at index ${i}: ${clip.endTime}`);
        return res.json({ 
          success: false, 
          message: `Invalid endTime format at index ${i}` 
        });
      }
    }

    // Get the original video document
    const videoDoc = await databases.getDocument(
      DATABASE_ID, 
      VIDEOS_COLLECTION_ID, 
      transcriptDoc.videoId
    );

    log(`Video document retrieved: ${videoDoc.$id}, fileName: ${videoDoc.fileName}`);

    // Try to download the original video file
    // First try using the video document ID (most common case)
    let videoFileId = transcriptDoc.videoId;
    let originalVideoFile;
    
    try {
      log(`Attempting to download video file using video ID: ${videoFileId}`);
      originalVideoFile = await storage.getFileDownload('videos', videoFileId);
      log(`Successfully downloaded video file using video ID: ${videoFileId}`);
    } catch (downloadError) {
      log(`Failed to download using video ID. Error: ${downloadError.message}`);
      
      // If video ID doesn't work, try using the document ID as file ID
      try {
        videoFileId = videoDoc.$id;
        log(`Trying with document ID: ${videoFileId}`);
        originalVideoFile = await storage.getFileDownload('videos', videoFileId);
        log(`Successfully downloaded video file using document ID: ${videoFileId}`);
      } catch (secondDownloadError) {
        log(`Failed to download using document ID. Error: ${secondDownloadError.message}`);
        throw new Error(`Cannot download video file. Tried video ID (${transcriptDoc.videoId}) and document ID (${videoDoc.$id}). Last error: ${secondDownloadError.message}`);
      }
    }

    const tempVideoPath = `/tmp/original_${videoDoc.fileName}`;
    writeFileSync(tempVideoPath, Buffer.from(originalVideoFile));
    log(`Video file written to temporary path: ${tempVideoPath}`);

    const processedClipIds = [];

    // Process each clip
    for (let i = 0; i < clipsData.length; i++) {
      const clip = clipsData[i];
      const clipId = ID.unique();
      
      try {
        log(`Processing clip ${i + 1}/${clipsData.length}: ${clip.start}ms - ${clip.end}ms`);

        // Convert milliseconds to seconds for ffmpeg
        const startTime = clip.start / 1000;
        const endTime = clip.end / 1000;
        const duration = endTime - startTime;

        // Generate clip filename
        const clipFileName = `clip_${transcriptDoc.videoId}_${i + 1}_${Date.now()}.mp4`;
        const tempClipPath = `/tmp/${clipFileName}`;

        // Use ffmpeg to extract the clip
        await new Promise((resolve, reject) => {
          const ffmpeg = spawn(ffmpegStatic, [
            '-i', tempVideoPath,
            '-ss', startTime.toString(),
            '-t', duration.toString(),
            '-c', 'copy',
            '-avoid_negative_ts', 'make_zero',
            tempClipPath,
            '-y' // Overwrite output file
          ]);

          ffmpeg.stderr.on('data', (data) => {
            log(`FFmpeg stderr: ${data}`);
          });

          ffmpeg.on('close', (code) => {
            if (code === 0) {
              log(`Clip ${i + 1} extracted successfully`);
              resolve();
            } else {
              reject(new Error(`FFmpeg process exited with code ${code}`));
            }
          });

          ffmpeg.on('error', (err) => {
            reject(err);
          });
        });

        // Check if clip file was created successfully
        if (!existsSync(tempClipPath)) {
          throw new Error(`Clip file was not created: ${tempClipPath}`);
        }

        // Read the clip file and upload to storage
        const clipFileBuffer = readFileSync(tempClipPath);
        
        // Upload clip to clips bucket
        const clipFile = await storage.createFile(
          CLIPS_BUCKET_ID,
          clipId,
          clipFileName,
          clipFileBuffer
        );

        // Create clip metadata document
        const clipDocument = await databases.createDocument(
          DATABASE_ID,
          CLIPS_COLLECTION_ID,
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

        // Clean up temporary clip file
        unlinkSync(tempClipPath);

      } catch (clipError) {
        error(`Failed to process clip ${i + 1}: ${clipError.message}`);
        // Continue with next clip even if this one fails
      }
    }

    // Update the video document with clip IDs
    if (processedClipIds.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        transcriptDoc.videoId,
        {
          clipIds: processedClipIds
        }
      );
    }

    // Clean up temporary original video file
    if (existsSync(tempVideoPath)) {
      unlinkSync(tempVideoPath);
    }

    log(`Successfully processed ${processedClipIds.length}/${clipsData.length} clips`);

    return res.json({
      success: true,
      message: `Processed ${processedClipIds.length} clips successfully`,
      processedClips: processedClipIds.length,
      totalClips: clipsData.length,
      clipIds: processedClipIds
    });

  } catch (err) {
    error(`Error processing video clips: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    });
  }
};
