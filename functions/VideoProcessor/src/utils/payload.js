export async function processPayload(req, log, error, res) {
  // Process the request payload - expecting transcript document creation event
  let payload;
  if (typeof req.body === 'string') {
    try {
      payload = JSON.parse(req.body);
    } catch (parseError) {
      error(`Failed to parse request body: ${parseError.message}`);
      res.json({ success: false, message: 'Invalid JSON in request body' });
      return null;
    }
  } else {
    payload = req.body || req;
  }
  
  log(`Received payload type: ${typeof payload}`);
  log(`Payload keys: ${Object.keys(payload || {}).join(', ')}`);

  // Extract document data from the event
  let transcriptDoc;
  if (payload && payload.$id) {
    transcriptDoc = payload;
    log('Found direct document data in payload');
  } else if (payload && payload.document) {
    transcriptDoc = payload.document;
    log('Found document data in payload.document');
  } else {
    log('No valid document found in payload');
    log(`Available payload structure: ${JSON.stringify(payload, null, 2)}`);
    res.json({ success: false, message: 'No document found' });
    return null;
  }

  // Check if clipsTimestamps exists and is not empty
  if (!transcriptDoc.clipsTimestamps || transcriptDoc.clipsTimestamps.trim() === '') {
    log('No clips timestamps found in transcript document');
    log(`Document structure: ${JSON.stringify(transcriptDoc, null, 2)}`);
    res.json({ success: false, message: 'No clips timestamps to process' });
    return null;
  }

  return transcriptDoc;
}


export async function getVideoDocument(databases, config, videoId) {
  return await databases.getDocument(
    config.DATABASE_ID, 
    config.VIDEOS_COLLECTION_ID, 
    videoId
  );
}
