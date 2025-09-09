import { ID } from 'node-appwrite';

/**
 * Send an email notification to a user when video processing is complete
 * @param {Object} clients - Appwrite clients { messaging, databases, storage, config }
 * @param {Object} loggers - Logging functions { log, error }
 * @param {string} userId - The ID of the user to send the email to
 * @param {string} videoId - The ID of the video that was processed
 * @param {number} processedClips - Number of clips successfully processed
 * @param {number} totalClips - Total number of clips that were supposed to be processed
 * @param {string|null} thumbnailId - ID of the thumbnail file (if available)
 */
export async function sendProcessingCompleteEmail(clients, loggers, userId, videoId, processedClips, totalClips, thumbnailId = null) {
  const { messaging, config } = clients;
  const { log, error } = loggers;

  try {
    // Prepare email content
    const subject = 'Your video clips are ready';
    
    const html = `
      <h2>Video Processing Complete</h2>
      <p>Hello,</p>
      <p>Your video clip processing has been completed successfully.</p>
      <p><strong>Video ID:</strong> ${videoId}</p>
      <p><strong>Clips Processed:</strong> ${processedClips} of ${totalClips}</p>
      <p>You can now access your clips in the application.</p>
      <p>Best regards,<br>The Buzzler Team</p>
    `;

    // Prepare attachments if thumbnail exists
    const attachments = [];
    if (thumbnailId) {
      attachments.push(`${config.THUMBNAILS_BUCKET_ID}:${thumbnailId}`);
    }

    // Send the email
    await messaging.createEmail({
      messageId: ID.unique(),
      subject,
      content: html,
      users: [userId],
      html: true,
      draft: false,
      attachments
    });

    log(`Successfully sent processing complete email to user ${userId}`);
  } catch (err) {
    error(`Failed to send processing complete email to user ${userId}: ${err.message}`);
  }
}

/**
 * Send an email notification when video processing fails
 * @param {Object} clients - Appwrite clients { messaging, databases, storage, config }
 * @param {Object} loggers - Logging functions { log, error }
 * @param {string} userId - The ID of the user to send the email to
 * @param {string} videoId - The ID of the video that failed processing
 * @param {string} errorMessage - The error message
 */
export async function sendProcessingFailedEmail(clients, loggers, userId, videoId, errorMessage) {
  const { messaging } = clients;
  const { log, error } = loggers;

  try {
    // Prepare email content
    const subject = 'Video Clip Processing Failed';
    
    const html = `
      <h2>Video Processing Failed</h2>
      <p>Hello,</p>
      <p>We're sorry, but your video clip processing has failed.</p>
      <p><strong>Video ID:</strong> ${videoId || 'Unknown'}</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p>Please try again or contact support if the problem persists.</p>
      <p>Best regards,<br>The Buzzler Team</p>
    `;

    // Send the email
    await messaging.createEmail({
      messageId: ID.unique(),
      subject,
      content: html,
      users: [userId],
      html: true,
      draft: false
    });

    log(`Successfully sent processing failed email to user ${userId}`);
  } catch (err) {
    error(`Failed to send processing failed email to user ${userId}: ${err.message}`);
  }
}

/**
 * Send an email notification when no clips timestamps are found
 * @param {Object} clients - Appwrite clients { messaging, databases, storage, config }
 * @param {Object} loggers - Logging functions { log, error }
 * @param {string} userId - The ID of the user to send the email to
 * @param {string} videoId - The ID of the video
 */
export async function sendNoClipsEmail(clients, loggers, userId, videoId) {
  const { messaging } = clients;
  const { log, error } = loggers;

  try {
    // Prepare email content
    const subject = 'No Clip Timestamps Found';
    
    const html = `
      <h2>No Clip Timestamps Found</h2>
      <p>Hello,</p>
      <p>We received a transcript for your video, but no clip timestamps were provided.</p>
      <p><strong>Video ID:</strong> ${videoId}</p>
      <p>No clips were processed as a result.</p>
      <p>Best regards,<br>The Buzzler Team</p>
    `;

    // Send the email
    await messaging.createEmail({
      messageId: ID.unique(),
      subject,
      content: html,
      users: [userId],
      html: true,
      draft: false
    });

    log(`Successfully sent no clips email to user ${userId}`);
  } catch (err) {
    error(`Failed to send no clips email to user ${userId}: ${err.message}`);
  }
}