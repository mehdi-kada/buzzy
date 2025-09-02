"use client";

import { useState, useRef, useEffect } from 'react';
import { AAIWord } from '@/interfaces/transcripts';

interface EditableTranscriptDisplayProps {
  words: AAIWord[];
  currentTime: number;
  onWordClick?: (word: AAIWord) => void;
  onWordsUpdate?: (updatedWords: AAIWord[]) => void;
}

export function EditableTranscriptDisplay({ 
  words, 
  currentTime, 
  onWordClick,
  onWordsUpdate
}: EditableTranscriptDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [editableWords, setEditableWords] = useState<AAIWord[]>(words);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Update editable words when source words change
  useEffect(() => {
    setEditableWords(words);
  }, [words]);

  // Find the active word based on current time
  useEffect(() => {
    if (editableWords.length === 0) return;

    // Find the word that corresponds to the current time
    const currentIndex = editableWords.findIndex(
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
  }, [currentTime, editableWords]);

  const handleWordClick = (word: AAIWord, index: number) => {
    if (onWordClick) {
      onWordClick(word);
    }
    
    // Start editing the clicked word
    setEditingWordIndex(index);
    setEditValue(word.text);
  };

  const handleEditSubmit = () => {
    if (editingWordIndex === null) return;
    
    const updatedWords = [...editableWords];
    updatedWords[editingWordIndex] = {
      ...updatedWords[editingWordIndex],
      text: editValue
    };
    
    setEditableWords(updatedWords);
    setEditingWordIndex(null);
    setEditValue('');
    
    // Notify parent of changes
    if (onWordsUpdate) {
      onWordsUpdate(updatedWords);
    }
  };

  const handleEditCancel = () => {
    setEditingWordIndex(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  if (editableWords.length === 0) {
    return <div className="text-center text-gray-500">No transcript available</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-wrap gap-1 p-4 max-h-[300px] overflow-y-auto border rounded-lg bg-gray-50 dark:bg-gray-800"
    >
      {editableWords.map((word, index) => (
        <div
          key={`${word.start}-${index}`}
          className="relative inline-block"
        >
          {editingWordIndex === index ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleEditSubmit}
                autoFocus
                className="px-1 py-0.5 rounded border text-black"
              />
              <button 
                onClick={handleEditSubmit}
                className="text-xs bg-green-500 text-white px-1 rounded"
              >
                ✓
              </button>
              <button 
                onClick={handleEditCancel}
                className="text-xs bg-red-500 text-white px-1 rounded"
              >
                ✕
              </button>
            </div>
          ) : (
            <span
              onClick={() => handleWordClick(word, index)}
              className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-200 ${
                index === activeWordIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {word.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}