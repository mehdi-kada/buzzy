import { Models, UploadProgress } from "appwrite";

export interface UploadVideoMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  thumbnailId?: string | null;
  onProgress?: (progress: { loaded: number; total: number; progress: number }) => void;
}

export interface UploadVideoResult {
  success: boolean;
  data: {
    file: Models.File;
    record: Models.Document;
    videoId: string;
  };
}
