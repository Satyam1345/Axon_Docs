'use client';
import { X, Brain, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * A component to display individual insights with proper formatting
 */
const InsightDisplay = ({ insight, originalText }) => {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-white shadow-sm">
      <div className="mb-3">
        <p className="text-xs text-red-600/70 font-medium truncate" title={originalText}>
           Source: {originalText}
        </p>
      </div>
      <div className="prose prose-sm max-w-none prose-headings:text-red-800 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-red-700 prose-ul:my-2 prose-li:my-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(insight || '')}</ReactMarkdown>
      </div>
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
    <div className={`transition-all duration-300 ease-in-out bg-red-50 border-l border-red-200 text-red-700 p-4 shadow-lg h-full ${isOpen ? 'w-full md:w-[19rem] shrink-0 flex-none' : 'w-0'}`}> 
      <div className={`${!isOpen && 'hidden'} flex flex-col h-full`}> 
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Insights</h2>
          <button onClick={onClose} className="text-red-700 hover:text-red-900" aria-label="Close insights">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              Text for Analysis
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to generate comprehensive insights including key takeaways, facts, contradictions, examples, and W-questions analysis..."
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
                <span>Generating Insights...</span>
              </>
            ) : (
              <>
                <Brain size={16} />
                <span>Generate Comprehensive Insights</span>
              </>
            )}
          </button>
          <div className="text-xs text-red-600/70 italic">
            💡 Generates: Key takeaways, facts, contradictions, examples, and W-questions analysis
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {insightsHistory.length === 0 && (
            <div className="text-center py-8 px-4">
              <Brain size={32} className="text-red-300 mx-auto mb-3" />
              <p className="text-sm text-red-600/70 mb-2">No insights generated yet</p>
              <p className="text-xs text-red-500/60">
                Paste some text above or generate overview insights from your documents
              </p>
            </div>
          )}
          {insightsHistory.map((ins) => (
            <InsightDisplay 
              key={ins.id} 
              insight={ins.insights} 
              originalText={ins.originalText} 
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
                <Lightbulb size={16} />
                <span>Generate Overview Insights</span>
              </>
            )}
          </button>
          <div className="text-xs text-red-600/70 italic mt-2 text-center">
             Analyzes all uploaded documents together
          </div>
        </div>
      </div>
    </div>
  );
}
