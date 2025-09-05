export async function validateClipsData(transcriptDoc, log, error, res) {
  log(`Found clipsTimestamps: ${transcriptDoc.clipsTimestamps}`);

  // Parse the clips timestamps
  let clipsData;
  try {
    if (typeof transcriptDoc.clipsTimestamps === 'string') {
      clipsData = JSON.parse(transcriptDoc.clipsTimestamps);
    } else {
      clipsData = transcriptDoc.clipsTimestamps;
    }
    
    if (!Array.isArray(clipsData)) {
      throw new Error('clipsTimestamps must be an array');
    }
  } catch (parseError) {
    error(`Failed to parse clipsTimestamps: ${parseError.message}`);
    error(`clipsTimestamps content: ${transcriptDoc.clipsTimestamps}`);
    error(`clipsTimestamps type: ${typeof transcriptDoc.clipsTimestamps}`);
    res.json({ success: false, message: 'Invalid clips timestamps format' });
    return null;
  }

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
      res.json({ 
        success: false, 
        message: `Invalid clip format at index ${i}. Required fields: start, end (must be numbers)` 
      });
      return null;
    }
    
    // Validate time values are positive
    if (clip.start < 0 || clip.end < 0 || clip.start >= clip.end) {
      error(`Invalid time values at index ${i}: start=${clip.start}, end=${clip.end}`);
      res.json({ 
        success: false, 
        message: `Invalid time values at index ${i}. Start must be >= 0 and end must be > start.` 
      });
      return null;
    }
  }

  return clipsData;
}
