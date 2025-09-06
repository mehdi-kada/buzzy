import { initializeAppwrite } from './appwrite.js';
import { downloadVideoFile, cleanupTempFiles } from './utils/fileHandler.js';
import { processClips} from './services/clipService.js';

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

    
    // Validate clips data
    const clipsData = JSON.parse(transcriptDoc.clipsTimestamps);

    const tempVideoPath = await downloadVideoFile(storage, config, transcriptDoc.videoId);
    
    // Process all clips
    const processedClipIds = await processClips(
      clipsData, 
      transcriptDoc, 
      tempVideoPath, 
      { databases, storage, config },
      { log, error }
    );
    
    // Update video document with clip IDs
    if (processedClipIds.length > 0) {
        await databases.updateDocument(
          config.DATABASE_ID,
          config.VIDEOS_COLLECTION_ID,
          transcriptDoc.videoId,
          { clipIds: processedClipIds }
      );
    }
    
    // Cleanup
    await cleanupTempFiles([tempVideoPath]);
    
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
