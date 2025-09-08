import { Models } from 'appwrite';

// Base Appwrite types
export interface AppwriteDocument extends Models.Document {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

// User related types
export interface User extends Models.User<Models.Preferences> {
  $id: string;
  email: string;
  name: string;
}

// Video/Project types
export type VideoStatus = 'uploaded' | 'processing' | 'completed' | 'failed' | 'published' | 'draft';

export interface Video extends AppwriteDocument {
  userId: string;
  title: string;
  description?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  duration?: number;
  thumbnailId?: string;
  category?: string;
  tags?: string[];
  status: VideoStatus;
  clipIds?: string[];
  transcript?: ProjectTranscript;
}

// Transcript types
export interface AAIWord {
  start: number; // seconds
  end: number; // seconds
  text: string;
  confidence: number;
  speaker?: string | null;
}

export interface AAISentimentResult {
  text: string;
  start: number;
  end: number;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  speaker?: string;
}

export interface ProjectTranscript extends AppwriteDocument {
  userId: string;
  videoId: string;
  text: string;
  confidence: number;
  languageCode: string;
  audioDurationSec: number;
  wordsCount: number;
  status: string;
  aaiTranscriptId: string;
  words?: string; // JSON string of AAIWord[]
  clipsTimestamps?: string; // JSON string of clip timestamps
  transcriptFileId: string;
}

// Clip types
export interface ClipTimestamp {
  start: number;
  end: number;
  text: string;
}

export interface Clip extends AppwriteDocument {
  userId: string;
  videoId: string;
  fileName: string;
  startTime: number; // milliseconds
  endTime: number; // milliseconds
  duration: number; // milliseconds
  text?: string;
  bucketFileId: string;
  sizeBytes?: number;
  mimeType?: string;
}

// API Request/Response types
export interface TranscribeRequest {
  audioUrl: string;
  videoId: string;
  userId: string;
}

export interface TranscribeResponse {
  id: string;
  status: string;
  text: string;
  confidence: number;
  audio_duration: number;
  words?: AAIWord[];
  language_code: string;
  transcriptId?: string;
  wordsCount: number;
  clipsTimestamps?: string;
  storageWarning?: string;
}

export interface ClipsRequest {
  videoId: string;
  userId: string;
}

export interface APIErrorResponse {
  error: string;
  details?: string;
}

// Upload types
export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface UploadVideoMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  thumbnailId?: string | null;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadVideoResult {
  success: boolean;
  data: {
    file: Models.File;
    record: Models.Document;
    videoId: string;
  };
}

// UI/Component types
export interface ProjectCardData {
  $id: string;
  title: string;
  description?: string | null;
  thumbnailId?: string | null;
  $createdAt: string;
  status: VideoStatus;
  duration?: string;
  clipCount?: number;
  postCount?: number;
  viewCount?: number;
}

// Auth types
export interface AuthResult {
  success: boolean;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}
