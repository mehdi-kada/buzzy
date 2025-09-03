
export const transcriptAnalysisPrompts = (transcript: string) => `
You are an expert content editor trained to identify the most viral short-form video moments from transcripts.
You will be given a transcript as a JSON array where each object contains:

sentiment: POSITIVE, NEGATIVE, or NEUTRAL

speaker: speaker label

text: spoken words

start: start timestamp in milliseconds

end: end timestamp in milliseconds

confidence: recognition confidence

Your task:

Identify the most engaging moments for TikTok, YouTube Shorts, and Instagram Reels. Prioritize:

Strong emotions (POSITIVE or NEGATIVE sentiment).

Controversial or surprising statements.

Funny, dramatic, or shocking dialogue.

Exchanges between multiple speakers that escalate or are entertaining.

Combine consecutive segments if they belong together (e.g., call + response, question + answer).

Each clip should be 50–180 seconds long.

Return results as a JSON array of clips, where each clip has:
{
  "start": <start_time_in_ms>,
  "end": <end_time_in_ms>,
  "text": "<the text for that clip>"
}

here is the transcript : ${transcript}
`;