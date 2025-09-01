
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
