import { writeFileSync } from 'fs';

export function filterTranscriptForClip(fullTranscript, clipStartMs, clipEndMs) {
  let transcript;
  
  // Parse transcript if it's a string
  if (typeof fullTranscript === 'string') {
    transcript = JSON.parse(fullTranscript);
  } else {
    transcript = fullTranscript;
  }
  
  // Filter sentences that fall within the clip timerange
  const clipSentences = transcript.filter(sentence => {
    return sentence.start < clipEndMs && sentence.end > clipStartMs;
  });
  
  // Adjust timestamps to be relative to clip start (0-based)
  return clipSentences.map(sentence => ({
    ...sentence,
    start: Math.max(0, sentence.start - clipStartMs),
    end: Math.max(sentence.end - clipStartMs, sentence.start - clipStartMs + 500) // Minimum 500ms duration
  }));
}

export function generateSubtitleFile(clipSentences, outputPath) {
  let srtContent = '';
  let subtitleIndex = 1;
  
  // Each sentence becomes one subtitle block
  clipSentences.forEach(sentence => {
    const startTime = formatSRTTime(sentence.start);
    const endTime = formatSRTTime(sentence.end);
    
    srtContent += `${subtitleIndex}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${sentence.text}\n\n`;
    subtitleIndex++;
  });
  
  writeFileSync(outputPath, srtContent);
  return outputPath;
}

export function generateSubtitleFileWithSentiment(clipSentences, outputPath) {
  let srtContent = '';
  let subtitleIndex = 1;
  
  // Each sentence with sentiment color coding
  clipSentences.forEach(sentence => {
    const startTime = formatSRTTime(sentence.start);
    const endTime = formatSRTTime(sentence.end);
    
    // Add sentiment indicator (optional)
    let displayText = sentence.text;
    if (sentence.sentiment) {
      // You can optionally add sentiment indicators
      // displayText = `[${sentence.sentiment}] ${sentence.text}`;
      displayText = sentence.text; // Keep clean for now
    }
    
    srtContent += `${subtitleIndex}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${displayText}\n\n`;
    subtitleIndex++;
  });
  
  writeFileSync(outputPath, srtContent);
  return outputPath;
}

function formatSRTTime(milliseconds) {
  const totalMs = Math.max(0, milliseconds);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
