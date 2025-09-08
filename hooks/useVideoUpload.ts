"use client";

import { useState, useRef, ChangeEvent } from "react";
import { VideoUploadService } from "@/lib/videos/videoUploadService";
import type { UploadVideoResult, UploadVideoMetadata } from "@/types";
// Removed UploadProgress import since we normalize progress object in service

interface FormStateMeta {
  title: string;
  description: string;
  tags: string; // comma separated input
  category: string;
  isPublic: boolean;
}

const DEFAULT_FORM: FormStateMeta = {
  title: "",
  description: "",
  tags: "",
  category: "uncategorized",
  isPublic: false
};

export const useVideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<UploadVideoResult["data"] | null>(null);
  const [error, setError] = useState<string>("");
  const [metadata, setMetadata] = useState<FormStateMeta>(DEFAULT_FORM);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // No fallback interval; rely on Appwrite SDK progress events

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setUploadResult(null);
      setValidationIssues([]);
      setMetadata(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    }
  };

  const handleMetadataChange = <K extends keyof FormStateMeta>(field: K, value: FormStateMeta[K]) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const validateBeforeUpload = (): boolean => {
    const issues: string[] = [];
    if (!selectedFile) issues.push("No file selected");
    if (!metadata.title.trim()) issues.push("Title is required");
    if (metadata.tags.length > 0 && metadata.tags.split(",").length > 25) issues.push("Too many tags (max 25)");
    setValidationIssues(issues);
    return issues.length === 0;
  };

  const handleUpload = async () => {
    if (!validateBeforeUpload() || !selectedFile) return;
    
  setIsUploading(true);
  setError("");
  setUploadProgress(0);

    const meta: UploadVideoMetadata = {
      title: metadata.title.trim(),
      description: metadata.description.trim(),
      tags: metadata.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean),
      category: metadata.category,
      isPublic: metadata.isPublic,
      onProgress: (p: { loaded: number; total: number; progress: number }) => {
        if (p && typeof p === 'object') {
          const progress = Math.round(p.progress || (p.loaded / p.total) * 100);
          setUploadProgress(progress);
        }
      }
    };

    try {
      const result = await VideoUploadService.uploadVideo(selectedFile, meta);
      setUploadProgress(100);
      
      if (result.success) {
        setUploadResult(result.data);
        setSelectedFile(null);
        setMetadata(DEFAULT_FORM);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError("");
    setUploadProgress(0);
    setMetadata(DEFAULT_FORM);
    setValidationIssues([]);
  if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return {
    // State
    selectedFile,
    uploadProgress,
    isUploading,
    uploadResult,
    error,
    metadata,
    validationIssues,
    fileInputRef,
    
    // Actions
    handleFileSelect,
    handleMetadataChange,
    handleUpload,
    resetUpload,
    validateBeforeUpload
  };
};

export type { FormStateMeta };
export { DEFAULT_FORM };
