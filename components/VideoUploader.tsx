"use client";

import { useVideoUpload } from "@/hooks/useVideoUpload";
import { storage } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

      // Check if transcript was stored successfully
      if (transcripts.storageWarning) {
        console.warn("Storage warning:", transcripts.storageWarning);
      }

      if (!transcripts.transcriptId && !transcripts.storageWarning) {
        throw new Error("Transcript was processed but not stored in database");
      }

      console.log("transcripts:", transcripts); 
      
    } catch (err) {
      if (!cancelled) console.error("Failed to build video URL:", err);
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}, [uploadResult]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Upload Video</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Video File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          disabled={isUploading}
        />
      </div>

      {selectedFile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
          <h3 className="font-medium mb-2">Selected File</h3>
          <p><strong>Name:</strong> {selectedFile.name}</p>
          <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p><strong>Type:</strong> {selectedFile.type}</p>
        </div>
      )}

      {selectedFile && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={metadata.title}
              onChange={e => handleMetadataChange("title", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isUploading}
              placeholder="Enter a descriptive title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={metadata.description}
              onChange={e => handleMetadataChange("description", e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isUploading}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={metadata.tags}
              onChange={e => handleMetadataChange("tags", e.target.value)}
              placeholder="education, tutorial, demo"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={metadata.category}
              onChange={e => handleMetadataChange("category", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
        <ul className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm list-disc list-inside text-yellow-800">
          {validationIssues.map(issue => <li key={issue}>{issue}</li>)}
        </ul>
      )}

      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-blue-700">Uploading...</span>
            <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {uploadResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-sm">
          <h3 className="font-medium text-green-800 mb-2">Upload Successful!</h3>
          <p className="text-green-700"><strong>Video ID:</strong> {uploadResult.videoId}</p>
          <p className="text-green-700"><strong>File ID:</strong> {uploadResult.file.$id}</p>
        </div>
      )}

      <div className="flex gap-4">
        {selectedFile && !isUploading && (
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isUploading}
          >
            Upload Video
          </button>
        )}
        {(selectedFile || uploadResult) && !isUploading && (
          <button
            onClick={resetUpload}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
