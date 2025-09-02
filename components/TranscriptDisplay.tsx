"use client";

import { useState, useRef, useEffect } from 'react';
import { AAIWord } from '@/interfaces/transcripts';

interface TranscriptDisplayProps {
  words: AAIWord[];
  currentTime: number;
  onWordClick?: (word: AAIWord) => void;
}

export function TranscriptDisplay({ words, currentTime, onWordClick }: TranscriptDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Find the active word based on current time
  useEffect(() => {
    if (words.length === 0) return;

    // Find the word that corresponds to the current time
    const currentIndex = words.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );

    setActiveWordIndex(currentIndex);

    // Scroll to the active word
    if (currentIndex !== -1 && containerRef.current) {
      const wordElement = containerRef.current.children[currentIndex] as HTMLElement;
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [currentTime, words]);

  const handleWordClick = (word: AAIWord, index: number) => {
    if (onWordClick) {
      onWordClick(word);
    }
  };

  if (words.length === 0) {
    return <div className="text-center text-gray-500">No transcript available</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-wrap gap-1 p-4 max-h-[300px] overflow-y-auto"
    >
      {words.map((word, index) => (
        <span
          key={`${word.start}-${index}`}
          onClick={() => handleWordClick(word, index)}
          className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-200 ${
            index === activeWordIndex
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}