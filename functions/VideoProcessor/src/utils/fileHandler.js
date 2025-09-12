import { writeFileSync, unlinkSync, existsSync } from 'fs';

export async function downloadVideoFile(storage, config, videoId) {
  try {
    console.log(`Attempting to download video file. Bucket ID: ${config.VIDEOS_BUCKET_ID}, File ID: ${videoId}`);
    const originalVideoFile = await storage.getFileDownload(config.VIDEOS_BUCKET_ID, videoId);
    const tempVideoPath = `/tmp/original_${videoId}.mp4`;

    // Handle ArrayBuffer (which is what Appwrite returns)
    if (originalVideoFile instanceof ArrayBuffer) {
      writeFileSync(tempVideoPath, Buffer.from(originalVideoFile));
    } else if (Buffer.isBuffer(originalVideoFile)) {
      writeFileSync(tempVideoPath, originalVideoFile);
    } else {
      // Fallback for other types
      writeFileSync(tempVideoPath, Buffer.from(originalVideoFile));
    }
    
    // Verify file was written successfully
    if (!existsSync(tempVideoPath)) {
      throw new Error('Video file was not written to disk');
    }
    
    return tempVideoPath;
  } catch (downloadError) {
    console.error(`Error in getFileDownload. Bucket ID: ${config.VIDEOS_BUCKET_ID}, File ID: ${videoId}. Appwrite Error: ${downloadError.message}`);
    throw new Error(`Failed to download video: ${downloadError.message}`);
  }
}

export async function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}