'use client';
import { X, Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPodcastScriptPrompt } from '@/lib/prompts';

export default function PodcastSidebar({ isOpen, onClose }) {
  const [text, setText] = useState('');
  const [persona, setPersona] = useState('');
  const [jobTask, setJobTask] = useState('');

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

  const handleGenerate = () => {
    const prompt = createPodcastScriptPrompt(text, persona, jobTask);
    console.log('Generated Prompt for LLM:', prompt);
    // We will implement the backend call here later
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
          className="w-full py-2 rounded flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white"
        >
          <Mic size={16} />
          Generate Podcast
        </button>
      </div>
    </div>
  );
}
