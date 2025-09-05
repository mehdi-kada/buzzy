import { initializeAppwrite } from './appwrite.js';
import { processPayload, getVideoDocument } from './utils/payload.js';
import { validateClipsData } from './utils/validation.js';
import { downloadVideoFile, cleanupTempFiles } from './utils/fileHandler.js';
import { processClips, updateVideoWithClips } from './services/clipService.js';

export default async ({ req, res, log, error }) => {
  try {
    // Handle ping requests
    if (req.path === "/ping") {
      return res.text("Pong");
    }

    const { databases, storage, config } = await initializeAppwrite(req);
    
    // Process and validate payload
    const transcriptDoc = await processPayload(req, log, error, res);
    if (!transcriptDoc) return; // Response already sent
    
    // Validate clips data
    const clipsData = await validateClipsData(transcriptDoc, log, error, res);
    if (!clipsData) return; // Response already sent
    
    log(`Processing ${clipsData.length} clips for video ${transcriptDoc.videoId}`);
    
    // Get video document and download file
    const videoDoc = await getVideoDocument(databases, config, transcriptDoc.videoId);
    const tempVideoPath = await downloadVideoFile(storage, config, transcriptDoc.videoId, videoDoc);
    
    // Process all clips
    const processedClipIds = await processClips(
      clipsData, 
      transcriptDoc, 
      videoDoc, 
      tempVideoPath, 
      { databases, storage, config },
      { log, error }
    );
    
    // Update video document with clip IDs
    if (processedClipIds.length > 0) {
      await updateVideoWithClips(databases, config, transcriptDoc.videoId, processedClipIds);
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
