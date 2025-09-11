
import { ID, Query, type Models, Permission, Role } from "appwrite";
import {  BUCKET_ID, DATABASE_ID, databases, VIDEOS_COLLECTION_ID, account,storage } from "../appwrite";
import { getVideoDuration, validateVideoFile } from "./videoValidation";
import { UploadVideoMetadata, UploadVideoResult } from "@/types";


export class VideoUploadService {
  /**
   * Upload a video file and create its document record.
   */
  static async uploadVideo(file: File, metadata: UploadVideoMetadata = {}): Promise<UploadVideoResult> {
    try {
      // Check authentication first
      let user;
      try {
        user = await account.get();
        console.log("User authenticated:", user.$id);
      } catch (authError) {
        throw new Error("User not authenticated. Please log in and try again.");
      }

      const validation = validateVideoFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Validate file size (Appwrite has limits)
      const maxSize = 30 * 1024 * 1024; // 30MB limit for most Appwrite instances
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      }

      const duration = await getVideoDuration(file as any as Blob);
      const videoId = ID.unique();

      console.log("Starting file upload...", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.$id
      });

      const uploadResult = await storage.createFile(
        BUCKET_ID,
        videoId,
        file,
        [
          Permission.read(Role.any()),
          Permission.write(Role.user(user.$id)), // Set appropriate permissions
        ],
        (progress) => {
          // You can pass the progress to your UI component if needed
          if (metadata.onProgress) {
            metadata.onProgress({
              loaded: Math.round((progress.progress / 100) * file.size),
              total: file.size,
              progress: progress.progress
            });
          }
          console.log(`Uploading... ${progress.progress}%`);
        }
      );

      console.log("File uploaded successfully:", uploadResult.$id);

      // Create video metadata document
      const title = metadata.title || file.name;
      const tags = metadata.tags || [];

      const videoRecord = await databases.createDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        videoId,
        {
          userId: user.$id,
          title,
          description: metadata.description || "",
          fileName: uploadResult.name,
          mimeType: file.type || 'video/mp4',
          sizeBytes: uploadResult.sizeOriginal,
          duration: duration,
          tags,
          category: metadata.category || "uncategorized",
          thumbnailId: metadata.thumbnailId || null,
          status: "uploaded", // Set initial status
          clipIds: [], // Initialize empty clip array
        }
      );

      console.log("Video record created:", videoRecord.$id);

      return {
        success: true,
        // The uploadResult from createFile is already the file object you need.
        // No need to create a new one manually.
        data: { file: uploadResult, record: videoRecord, videoId }
      };
    } catch (error: any) {
      console.error("Error uploading video:", error);
      
      // Provide more specific error messages
      if (error?.code === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }
      
      if (error?.code === 400) {
        throw new Error("Invalid request. Please check your file and try again.");
      }
      
      if (error?.message?.includes("Failed to fetch")) {
        throw new Error("Network error. Please check your internet connection and try again.");
      }
      
      throw error instanceof Error ? error : new Error("An unknown error occurred during video upload.");
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
          Query.orderDesc("$createdAt"),
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
          Query.orderDesc("$createdAt")
        ]
      );
      return results.documents;
    } catch (error) {
      return [];
    }
  }
}