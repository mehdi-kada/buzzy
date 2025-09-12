import { initializeAppwrite } from './appwrite.js';
import { downloadVideoFile, cleanupTempFiles } from './utils/fileHandler.js';
import { processClips} from './services/clipService.js';
import { getVideoDimensions, generateThumbnail } from './utils/ffmpeg.js';
import { sendProcessingCompleteEmail, sendProcessingFailedEmail, sendNoClipsEmail } from './utils/messaging.js';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export default async ({ req, res, log, error }) => {
  try {
    // Handle ping requests
    if (req.path === "/ping") {
      return res.text("Pong");
    }

    const { databases, storage, messaging, config } = await initializeAppwrite(req);
    
    // Process and validate payload
    const transcriptDoc = req.body || req;
    if (!transcriptDoc) return;

    const videoId = transcriptDoc.video?.$id;
    const videoFileId = transcriptDoc.video?.fileId || transcriptDoc.videoId; // Fallback for older records

    if (!videoId || !videoFileId) {
      error('Transcript document is missing video information: video.$id or video.fileId is missing.');
      return res.json({ success: false, message: 'Transcript document is missing critical video information.' });
    }

    // Check if clipsTimestamps exists and is not empty
    if (!transcriptDoc.clipsTimestamps || transcriptDoc.clipsTimestamps.trim() === '') {
      log('No clips timestamps found in transcript document');
      log(`Document structure: ${JSON.stringify(transcriptDoc, null, 2)}`);
      
      // Send notification email about no clips
      if (transcriptDoc.userId) {
        await sendNoClipsEmail(
          { messaging, config },
          { log, error },
          transcriptDoc.userId,
          videoId
        );
      }
      
      res.json({ success: false, message: 'No clips timestamps to process' });
      return null;
    }

    log(`the transcript doc is : ${JSON.stringify(transcriptDoc)}`);

    
    // Validate clips data
    const clipsData = JSON.parse(transcriptDoc.clipsTimestamps);

    const tempVideoPath = await downloadVideoFile(storage, config, videoFileId);
    const videoDimensions = await getVideoDimensions(tempVideoPath);

    // Generate thumbnail for the main video
    let mainThumbnailId = null;
    const tempThumbnailPath = `/tmp/thumb_${videoId}.jpg`;
    try {
      await generateThumbnail(tempVideoPath, tempThumbnailPath, '00:00:01.000');
      console.log(`Uploading main video thumbnail to bucket: ${config.THUMBNAILS_BUCKET_ID}`);
      const thumbnailFile = await storage.createFile(
        config.THUMBNAILS_BUCKET_ID,
        ID.unique(),
        InputFile.fromPath(tempThumbnailPath, `thumb_${videoId}.jpg`)
      );
      mainThumbnailId = thumbnailFile.$id;
    } catch (thumbError) {
      error(`Failed to generate or upload main video thumbnail: ${thumbError.message}`);
      // Continue without a thumbnail if it fails
    }
    
    // Process all clips
    const processedClipIds = await processClips(
      clipsData, 
      transcriptDoc, 
      tempVideoPath, 
      videoDimensions,
      { databases, storage, config },
      { log, error }
    );
    
    // Update video document with clip IDs and thumbnail
    const updatePayload = {
      clipIds: processedClipIds,
      status: 'completed',
      thumbnailId: mainThumbnailId
    };

    if (processedClipIds.length > 0 || mainThumbnailId) {
        await databases.updateDocument(
          config.DATABASE_ID,
          config.VIDEOS_COLLECTION_ID,
          videoId,
          updatePayload
      );
    }
    
    // Cleanup
    const filesToClean = [tempVideoPath];
    if (mainThumbnailId) filesToClean.push(tempThumbnailPath);
    await cleanupTempFiles(filesToClean);
    
    // Delete the original video from Appwrite storage after processing
    try {
      log(`Attempting to delete original video from bucket ${config.VIDEOS_BUCKET_ID}: ${videoFileId}`);
      await storage.deleteFile(config.VIDEOS_BUCKET_ID, videoFileId);
      log(`Successfully deleted original video: ${videoFileId}`);
    } catch (deleteError) {
      error(`Failed to delete original video ${videoFileId}. Error: ${deleteError.message}`);
      // Do not fail the entire function if deletion fails. Just log it and continue.
    }
    
    // Send success email notification
    if (transcriptDoc.userId) {
      await sendProcessingCompleteEmail(
        { messaging, config },
        { log, error },
        transcriptDoc.userId,
        videoId,
        processedClipIds.length,
        clipsData.length,
        mainThumbnailId
      );
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
    // Send failure email notification
    try {
      const { messaging } = await initializeAppwrite(req);
      const transcriptDoc = req.body || req || {};
      
      if (transcriptDoc?.userId) {
        const videoId = transcriptDoc.video?.$id || transcriptDoc.videoId;
        await sendProcessingFailedEmail(
          { messaging },
          { log, error },
          transcriptDoc.userId,
          videoId,
          err.message
        );
      }
    } catch (emailError) {
      error(`Failed to send failure notification email: ${emailError.message}`);
    }
    
    error(`Error processing video clips: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    });
  }
};