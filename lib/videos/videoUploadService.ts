import { ID, Query, type Models, type UploadProgress, Permission, Role } from "appwrite";
import { storage, BUCKET_ID, DATABASE_ID, databases, VIDEOS_COLLECTION_ID, account } from "../appwrite";
import { getVideoDuration, validateVideoFile } from "./videoValidation";
import { UploadVideoMetadata, UploadVideoResult } from "@/interfaces/videoUpload";





export class VideoUploadService {
  /**
   * Upload a video file and create its document record.
   */
  static async uploadVideo(file: File, metadata: UploadVideoMetadata = {}): Promise<UploadVideoResult> {
    try {
      // Step 1: Resolve current user
      const user = await account.get();
      
      // Step 2: Validate the video file
      const validation = validateVideoFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Step 3: Get video duration
      const duration = await getVideoDuration(file as any as Blob);

      // Step 4: Generate unique ID for the video
      const videoId = ID.unique();

      // Step 5: Upload file to Appwrite Storage
      let uploadResult;
      try {
        uploadResult = await storage.createFile(
          BUCKET_ID,
          videoId,
          file,
          [
            Permission.read(Role.any()),
            Permission.write(Role.user(user.$id))
          ],
          metadata.onProgress
        );
      } catch (uploadError: any) {
        // If permissions error, try without explicit permissions
        if (uploadError.message.includes('unauthorized') || uploadError.message.includes('not authorized') || uploadError.message.includes('permissions')) {
          uploadResult = await storage.createFile(
            BUCKET_ID,
            videoId,
            file,
            undefined,
            metadata.onProgress
          );
        } else if (uploadError.message.includes('HTTP2') || uploadError.message.includes('Protocol')) {
          // Wait and retry for protocol errors
          await new Promise(resolve => setTimeout(resolve, 1000));
          uploadResult = await storage.createFile(
            BUCKET_ID,
            videoId,
            file,
            undefined,
            metadata.onProgress
          );
        } else {
          throw uploadError;
        }
      }

      // Step 6: Create video metadata document
      const title = metadata.title || file.name;
      const tags = metadata.tags || [];

      const videoRecord = await databases.createDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        videoId,
        {
          userId: user.$id,
          fileId: uploadResult.$id,
          title,
          description: metadata.description || "",
          fileName: uploadResult.name,
          mimeType: uploadResult.mimeType,
          sizeBytes: uploadResult.sizeOriginal,
          duration: duration,
          tags,
          category: metadata.category || "uncategorized",
          thumbnailId: metadata.thumbnailId || null,
        }
      );

      return {
        success: true,
        data: { file: uploadResult, record: videoRecord, videoId }
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error uploading video");
    }
  }

  // Get videos for a specific user
  static async getUserVideos(userId: string, limit = 10, offset = 0): Promise<Models.Document[]> {
    try {
    const results = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.limit(limit),
          Query.offset(offset),
      Query.orderDesc("uploadedAt"), // if field absent, consider $createdAt
        ]
      );
      return results.documents;
    } catch (error) {
      return [];
    }
  }

  // Get current user's videos
  static async getMyVideos(limit = 10, offset = 0): Promise<Models.Document[]> {
    try {
      let user: any = null;
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          user = data.user;
        }
      } catch { /* ignore */ }
      if (!user) {
        try { user = await account.get(); } catch { /* ignore */ }
      }
      if (!user) throw new Error('User not authenticated');
      return await this.getUserVideos(user.$id, limit, offset);
    } catch (error) {
      return [];
    }
  }

  static async searchUserVideos(userId: string, query: string, limit = 10): Promise<Models.Document[]> {
    if (!query?.trim()) return [];
    try {
    const results = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.search("searchKeywords", query),
          Query.limit(limit),
      Query.orderDesc("uploadedAt")
        ]
      );
      return results.documents;
    } catch (error) {
      return [];
    }
  }
}