'use client';

import { useVideoUpload } from "@/hooks/useVideoUpload";
import { storage } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const VideoUploader = () => {
  const { user } = useAuth();
  const {
    selectedFile,
    uploadProgress,
    isUploading,
    uploadResult,
    error,
    metadata,
    validationIssues,
    fileInputRef,
    handleFileSelect,
    handleMetadataChange,
    handleUpload,
    resetUpload
  } = useVideoUpload();

  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

useEffect(() => {
  if (!uploadResult) return;

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  const fileId = uploadResult.videoId; // ensure this matches the file $id (sometimes it's uploadResult.file.$id)

  let cancelled = false;

  const load = async () => {
    try {
      // For a playable/streamable link use getFileView; for forced download use getFileDownload
      const url = storage.getFileView(bucketId, fileId);
      console.log("video url:", url); 
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        if (!cancelled) {
          router.push('/projects');
        }
      }, 1000);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          audioUrl: url,
          videoId: fileId,
          userId: user.$id
        }),
      });
      if (cancelled) return;

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }

      const transcripts = await response.json();
      if (transcripts.error) {
        throw new Error(`Transcription error: ${transcripts.error}`);
      }

      if (transcripts.storageWarning) {
        console.warn("Storage warning:", transcripts.storageWarning);
      }

      if (!transcripts.transcriptId && !transcripts.storageWarning) {
        throw new Error("Transcript was processed but not stored in database");
      }

    } catch (err) {
      if (!cancelled) console.error("Failed to build video URL:", err);
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}, [uploadResult, router, user]);

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-amber-100 dark:border-amber-900/40">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Successful!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your video is being processed. You'll be redirected to your projects page shortly.</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-amber-100 dark:border-amber-900/40">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Upload Video</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">Select Video File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-amber-200 dark:file:border-amber-900/40 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50"
          disabled={isUploading}
        />
      </div>

      {selectedFile && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-sm space-y-1">
          <h3 className="font-medium text-amber-900 dark:text-amber-200 mb-2">Selected File</h3>
          <p className="text-amber-900 dark:text-amber-200"><strong>Name:</strong> {selectedFile.name}</p>
          <p className="text-amber-900 dark:text-amber-200"><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p className="text-amber-900 dark:text-amber-200"><strong>Type:</strong> {selectedFile.type}</p>
        </div>
      )}

      {selectedFile && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Title</label>
            <input
              type="text"
              value={metadata.title}
              onChange={e => handleMetadataChange("title", e.target.value)}
              className="w-full p-2 border border-amber-200 dark:border-amber-900/40 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              disabled={isUploading}
              placeholder="Enter a descriptive title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Description</label>
            <textarea
              value={metadata.description}
              onChange={e => handleMetadataChange("description", e.target.value)}
              rows={3}
              className="w-full p-2 border border-amber-200 dark:border-amber-900/40 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              disabled={isUploading}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={metadata.tags}
              onChange={e => handleMetadataChange("tags", e.target.value)}
              placeholder="education, tutorial, demo"
              className="w-full p-2 border border-amber-200 dark:border-amber-900/40 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Category</label>
            <select
              value={metadata.category}
              onChange={e => handleMetadataChange("category", e.target.value)}
              className="w-full p-2 border border-amber-200 dark:border-amber-900/40 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              disabled={isUploading}
            >
              <option value="uncategorized">Uncategorized</option>
              <option value="general">General</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="tutorial">Tutorial</option>
              <option value="demo">Demo</option>
            </select>
          </div>
        </div>
      )}

      {validationIssues.length > 0 && (
        <ul className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded text-sm list-disc list-inside text-amber-800 dark:text-amber-300">
          {validationIssues.map(issue => <li key={issue}>{issue}</li>)}
        </ul>
      )}

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Uploading...</span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{uploadProgress}%</span>
          </div>
            <div className="w-full bg-amber-100 dark:bg-amber-900/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-600 h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-md text-sm">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {uploadResult && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-md text-sm">
          <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Upload Successful!</h3>
          <p className="text-green-700 dark:text-green-300"><strong>Video ID:</strong> {uploadResult.videoId}</p>
          <p className="text-green-700 dark:text-green-300"><strong>File ID:</strong> {uploadResult.file.$id}</p>
        </div>
      )}

      <div className="flex gap-4">
        {selectedFile && !isUploading && (
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            disabled={isUploading}
          >
            Upload Video
          </button>
        )}
        {(selectedFile || uploadResult) && !isUploading && (
          <button
            onClick={resetUpload}
            className="px-6 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
