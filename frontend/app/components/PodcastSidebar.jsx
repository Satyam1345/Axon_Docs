'use client';
import { X, Mic } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PodcastSidebar({ isOpen, onClose }) {
  const [text, setText] = useState('');
  const [persona, setPersona] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const context = sessionStorage.getItem('podcastContext');
      if (context) {
        const { persona, jobTask } = JSON.parse(context);
        setPersona(persona);
        setJobTask(jobTask);
      }
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!text) {
      alert('Please enter some text to generate a podcast.');
      return;
    }
    setIsLoading(true);
    setAudioUrl('');
    try {
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, persona, jobTask }),
      });

      if (!response.ok) {
        // Try to parse error response as JSON
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || 'Failed to generate podcast audio.');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ease-in-out bg-red-50 border-l border-red-200 text-red-700 p-4 shadow-lg ${isOpen ? 'w-80' : 'w-0'}`}>
      <div className={`flex justify-between items-center mb-4 ${!isOpen && 'hidden'}`}>
        <h2 className="text-xl font-bold">Podcast Mode</h2>
        <button onClick={onClose} className="text-red-700 hover:text-red-900">
          <X size={24} />
        </button>
      </div>
      <div className={`space-y-4 ${!isOpen && 'hidden'}`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for the podcast..."
          className="w-full h-40 p-2 border border-red-200 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2 rounded flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white disabled:bg-red-400"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span>Generate Podcast</span>
            </>
          )}
        </button>
        {audioUrl && (
          <div className="mt-4">
            <h3 className="font-bold mb-2 text-center">Podcast Ready</h3>
            <audio controls src={audioUrl} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
