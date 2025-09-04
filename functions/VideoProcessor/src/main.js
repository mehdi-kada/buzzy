import { Client, Databases, Storage, ID } from 'node-appwrite';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { Readable } from 'stream';
import ffmpegStatic from 'ffmpeg-static';
import { InputFile } from 'node-appwrite/file';
// This Appwrite function processes video clips based on transcript timestamps
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY || req.headers['x-appwrite-key'] || '');

  const databases = new Databases(client);
  const storage = new Storage(client);
  
  // Prefer environment variables for flexibility (configure these in the Appwrite Function settings)
  // FALLBACKS kept for backward compatibility but will log warnings.
  const DATABASE_ID = process.env.APPWRITE_FUNCTION_DATABASE_ID || '68b2d533003210de565e';
  const VIDEOS_COLLECTION_ID = process.env.APPWRITE_FUNCTION_VIDEOS_COLLECTION_ID || 'videos';
  const TRANSCRIPTS_COLLECTION_ID = process.env.APPWRITE_FUNCTION_TRANSCRIPTS_COLLECTION_ID || 'transcripts';
  const CLIPS_COLLECTION_ID = process.env.APPWRITE_FUNCTION_CLIPS_COLLECTION_ID || 'clips';
  // Bucket IDs – the original code hard‑coded 'videos' but your client app uses BUCKET_ID from env.
  const VIDEOS_BUCKET_ID = process.env.APPWRITE_FUNCTION_VIDEOS_BUCKET_ID
    || process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID
    || process.env.VIDEOS_BUCKET_ID
    || 'videos'; // last resort fallback (likely wrong if you see bucket not found errors)
  const CLIPS_BUCKET_ID = process.env.APPWRITE_FUNCTION_CLIPS_BUCKET_ID || 'clips';




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
    log(`First clip data types: start=${typeof clipsData[0]?.start}, end=${typeof clipsData[0]?.end}`);
    log(`First clip values: start=${clipsData[0]?.start}, end=${clipsData[0]?.end}`);

    // Validate clips data format
    for (let i = 0; i < clipsData.length; i++) {
      const clip = clipsData[i];
      
      // Convert start and end to numbers if they're strings
      if (typeof clip.start === 'string') {
        clip.start = parseInt(clip.start, 10);
      }
      if (typeof clip.end === 'string') {
        clip.end = parseInt(clip.end, 10);
      }
      
      if (typeof clip.start !== 'number' || typeof clip.end !== 'number' || isNaN(clip.start) || isNaN(clip.end)) {
        error(`Invalid clip format at index ${i}: ${JSON.stringify(clip)}`);
        return res.json({ 
          success: false, 
          message: `Invalid clip format at index ${i}. Required fields: start, end (must be numbers)` 
        });
      }
      
      // Validate time values are positive
      if (clip.start < 0 || clip.end < 0 || clip.start >= clip.end) {
        error(`Invalid time values at index ${i}: start=${clip.start}, end=${clip.end}`);
        return res.json({ 
          success: false, 
          message: `Invalid time values at index ${i}. Start must be >= 0 and end must be > start.` 
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
    let videoFileId = transcriptDoc.videoId; // Usually same as file & document ID (your upload service uses videoId for file id)
    let originalVideoFile;
    
    try {
      originalVideoFile = await storage.getFileDownload(VIDEOS_BUCKET_ID, videoFileId);
    } catch (downloadError) {
      log(`Failed to download using provided video ID '${videoFileId}' in bucket '${VIDEOS_BUCKET_ID}'. Error: ${downloadError.message}`);
      if (downloadError && downloadError.type) {
        log(`Appwrite error type: ${downloadError.type}`);
      }
      
    }

    const tempVideoPath = `/tmp/original_${videoDoc.fileName}`;
    writeFileSync(tempVideoPath, Buffer.from(originalVideoFile));


    const processedClipIds = [];

    // Process each clip
    for (let i = 0; i < clipsData.length; i++) {
      const clip = clipsData[i];
      const clipId = ID.unique();
      
      try {
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

          ffmpeg.on('close', (code) => {
            if (code === 0) {
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


        const clipFile = await storage.createFile(
          CLIPS_BUCKET_ID,
          clipId,
          InputFile.fromPath(tempClipPath, clipFileName) // ensures proper multipart + filename [12][14]
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
