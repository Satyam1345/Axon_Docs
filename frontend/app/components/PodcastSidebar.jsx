'use client';
import { X, Mic, Radio } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * A dedicated component to handle the lifecycle of a single audio player.
 * It creates a temporary URL from the audio blob and revokes it on cleanup.
 */
const AudioPlayer = ({ audioBlob, originalText }) => {
  const [audioUrl, setAudioUrl] = useState('');

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Cleanup function to revoke the object URL to prevent memory leaks
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  if (!audioUrl) {
    return null; // Don't render anything if the URL isn't ready
  }

  return (
    <div className="p-4 border border-red-200 rounded-lg bg-white shadow-sm">
      <div className="mb-3">
        <p className="text-xs text-red-600/70 font-medium truncate" title={originalText}>
          🎙️ Podcast: {originalText}
        </p>
      </div>
      <audio 
        controls 
        src={audioUrl} 
        className="w-full"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default function PodcastSidebar({ isOpen, onClose }) {
  const [text, setText] = useState('');
  const [persona, setPersona] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [podcastHistory, setPodcastHistory] = useState([]);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

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
  setIsLoadingText(true);
    try {
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, persona, jobTask }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || 'Failed to generate podcast audio.');
      }

      const audioBlob = await response.blob();
      
      // Add the new podcast object (with the actual blob) to the history
      setPodcastHistory(prevHistory => [
        { id: Date.now(), originalText: text, audioBlob }, 
        ...prevHistory
      ]);
      setText(''); // Clear the textarea for the next input

  } catch (error) {
      console.error('Error generating podcast:', error);
      alert(error.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  // Master overview generation across all uploaded PDFs
  const handleOverviewGenerate = async () => {
  setIsLoadingOverview(true);
    try {
      const response = await fetch('/api/generate-overview-podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobTask }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unexpected error.' }));
        throw new Error(errorData.error || 'Failed to generate overview podcast.');
      }
      const audioBlob = await response.blob();
      setPodcastHistory(prev => [
        { id: Date.now(), originalText: 'Overview of all documents', audioBlob },
        ...prev,
      ]);
  } catch (error) {
      console.error('Error generating overview podcast:', error);
      alert(error.message);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ease-in-out bg-red-50 border-l border-red-200 text-red-700 p-4 shadow-lg h-full ${isOpen ? 'w-full md:w-[19rem] shrink-0 flex-none' : 'w-0'}`}> 
      <div className={`${!isOpen && 'hidden'} flex flex-col h-full`}> 
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Podcast Generator</h2>
          <button onClick={onClose} className="text-red-700 hover:text-red-900" aria-label="Close podcast">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              Text for Podcast
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to generate a two-speaker podcast conversation with questions and answers..."
              className="w-full h-32 p-3 border border-red-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoadingText}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:from-red-400 disabled:to-red-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isLoadingText ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Podcast...</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>Generate Podcast</span>
              </>
            )}
          </button>
          <div className="text-xs text-red-600/70 italic">
            🎙️ Creates: Two-speaker conversation with natural Q&A dialogue
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {podcastHistory.length === 0 && (
            <div className="text-center py-8 px-4">
              <Radio size={32} className="text-red-300 mx-auto mb-3" />
              <p className="text-sm text-red-600/70 mb-2">No podcasts generated yet</p>
              <p className="text-xs text-red-500/60">
                Paste some text above or generate overview podcast from your documents
              </p>
            </div>
          )}
          {podcastHistory.map((podcast) => (
            <AudioPlayer 
              key={podcast.id} 
              audioBlob={podcast.audioBlob} 
              originalText={podcast.originalText} 
            />
          ))}
        </div>
        <div className="flex-shrink-0 border-t border-red-200 pt-4">
          <button
            onClick={handleOverviewGenerate}
            disabled={isLoadingOverview}
            className="w-full py-3 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:from-red-400 disabled:to-red-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isLoadingOverview ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Overview...</span>
              </>
            ) : (
              <>
                <Radio size={16} />
                <span>Generate Overview Podcast</span>
              </>
            )}
          </button>
          <div className="text-xs text-red-600/70 italic mt-2 text-center">
            📚 Creates podcast from all uploaded documents together
          </div>
        </div>
      </div>
    </div>
  );
}
