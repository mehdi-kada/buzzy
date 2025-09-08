
// Re-export centralized types for backward compatibility
export type {
  AAIWord,
  AAISentimentResult,
  Video,
  ProjectTranscript,
  Clip,
  ClipTimestamp,
  TranscribeRequest,
  TranscribeResponse
} from '@/types';

import type { ProjectTranscript } from '@/types';

// Legacy type alias for backward compatibility
export type Transcript = ProjectTranscript;
