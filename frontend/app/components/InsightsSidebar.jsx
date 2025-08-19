'use client';
import { X, Brain, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * A component to display individual insights with proper formatting
 */
const InsightDisplay = ({ insight, originalText }) => {
  return (
    <div className="mt-4 p-3 border border-blue-200 rounded-md bg-white">
      <p className="text-xs text-gray-500 mb-2 truncate" title={originalText}>{originalText}</p>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{insight}</div>
    </div>
  );
};

export default function InsightsSidebar({ isOpen, onClose }) {
  const [text, setText] = useState('');
  const [persona, setPersona] = useState('');
  const [jobTask, setJobTask] = useState('');
  const [insightsHistory, setInsightsHistory] = useState([]);
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
      alert('Please enter some text to generate insights.');
      return;
    }
    setIsLoadingText(true);
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, persona, jobTask }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        throw new Error(errorData.error || 'Failed to generate insights.');
      }

      const data = await response.json();
      
      // Add the new insights object to the history
      setInsightsHistory(prevHistory => [
        { id: Date.now(), originalText: text, insights: data.insights }, 
        ...prevHistory
      ]);
      setText(''); // Clear the textarea for the next input

    } catch (error) {
      console.error('Error generating insights:', error);
      alert(error.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  // Master overview generation across all uploaded PDFs
  const handleOverviewGenerate = async () => {
    setIsLoadingOverview(true);
    try {
      const response = await fetch('/api/generate-overview-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobTask }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unexpected error.' }));
        throw new Error(errorData.error || 'Failed to generate overview insights.');
      }
      const data = await response.json();
      setInsightsHistory(prev => [
        { id: Date.now(), originalText: 'Overview of all documents', insights: data.insights },
        ...prev,
      ]);
    } catch (error) {
      console.error('Error generating overview insights:', error);
      alert(error.message);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ease-in-out bg-blue-50 border-l border-blue-200 text-blue-700 p-4 shadow-lg h-full ${isOpen ? 'w-80' : 'w-0'}`}> 
      <div className={`${!isOpen && 'hidden'} flex flex-col h-full`}> 
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Insights</h2>
          <button onClick={onClose} className="text-blue-700 hover:text-blue-900">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text for AI analysis..."
            className="w-full h-40 p-2 border border-blue-200 rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoadingText}
            className="w-full py-2 rounded flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white disabled:bg-blue-400"
          >
            {isLoadingText ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Brain size={16} />
                <span>Generate Insights</span>
              </>
            )}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {insightsHistory.map((insight) => (
            <InsightDisplay 
              key={insight.id} 
              insights={insight.insights} 
              originalText={insight.originalText} 
            />
          ))}
        </div>
        <button
          onClick={handleOverviewGenerate}
          disabled={isLoadingOverview}
          className="w-full py-2 rounded flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white disabled:bg-blue-400"
        >
          {isLoadingOverview ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating Overview...</span>
            </>
          ) : (
            <>
              <Lightbulb size={16} />
              <span>Generate Overview Insights</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
