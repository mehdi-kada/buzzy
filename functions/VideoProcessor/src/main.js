import { initializeAppwrite } from './appwrite.js';
import { downloadVideoFile, cleanupTempFiles } from './utils/fileHandler.js';
import { processClips} from './services/clipService.js';
import { getVideoDimensions, generateThumbnail } from './utils/ffmpeg.js';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export default async ({ req, res, log, error }) => {
  try {
    // Handle ping requests
    if (req.path === "/ping") {
      return res.text("Pong");
    }

    const { databases, storage, config } = await initializeAppwrite(req);
    
    // Process and validate payload
      const transcriptDoc = req.body || req;
      if (!transcriptDoc) return;

  // Check if clipsTimestamps exists and is not empty
      if (!transcriptDoc.clipsTimestamps || transcriptDoc.clipsTimestamps.trim() === '') {
        log('No clips timestamps found in transcript document');
        log(`Document structure: ${JSON.stringify(transcriptDoc, null, 2)}`);
        res.json({ success: false, message: 'No clips timestamps to process' });
        return null;
      }

      log(`the transcript doc is : ${JSON.stringify(transcriptDoc)}`);

    
    // Validate clips data
    const clipsData = JSON.parse(transcriptDoc.clipsTimestamps);

    const tempVideoPath = await downloadVideoFile(storage, config, transcriptDoc.videoId);
    const videoDimensions = await getVideoDimensions(tempVideoPath);

    // Generate thumbnail for the main video
    let mainThumbnailId = null;
    const tempThumbnailPath = `/tmp/thumb_${transcriptDoc.videoId}.jpg`;
    try {
      await generateThumbnail(tempVideoPath, tempThumbnailPath, '00:00:01.000');
      console.log(`Uploading main video thumbnail to bucket: ${config.THUMBNAILS_BUCKET_ID}`);
      const thumbnailFile = await storage.createFile(
        config.THUMBNAILS_BUCKET_ID,
        ID.unique(),
        InputFile.fromPath(tempThumbnailPath, `thumb_${transcriptDoc.videoId}.jpg`)
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
          transcriptDoc.videoId,
          updatePayload
      );
    }
    
    // Cleanup
    const filesToClean = [tempVideoPath];
    if (mainThumbnailId) filesToClean.push(tempThumbnailPath);
    await cleanupTempFiles(filesToClean);
    
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
