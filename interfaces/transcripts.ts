
export type AAIWord = {
    start: number; // seconds
    end: number; // seconds
    text: string;
    confidence: number;
    speaker?: string|null;
};

export type Transcript = {
    userId: string;
    text: string;
    confidence: number;
    audio_duration: number; // seconds from AAI
    words?: AAIWord[];
    language_code?: string;
};


export interface Video {
    $id: string;
    userId: string;
    title: string;
    description?: string;
    fileName: string;
    duration?: number;
    thumbnailId?: string;
    status: string;
    $createdAt: string;
    clipIds?: string[];
    transcript?: Transcript;
}

export interface ProjectTranscript {
    $id: string;
    text: string;
    transcriptFileId: string;
    confidence: number;
    languageCode: string;
    audioDurationSec: number;
    wordsCount: number;
}

export interface Clip {
    $id: string;
    fileName: string;
    startTime: number;
    endTime: number;
    duration: number;
    text?: string;
    bucketFileId: string;
    sizeBytes?: number;
}
