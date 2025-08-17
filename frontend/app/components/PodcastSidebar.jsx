'use client';
import { X } from 'lucide-react';

export default function PodcastSidebar({ isOpen, onClose }) {
  return (
    <div className={`transition-all duration-300 ease-in-out bg-red-50 border-l border-red-200 text-red-700 p-4 shadow-lg ${isOpen ? 'w-80' : 'w-0'}`}>
      <div className={`flex justify-between items-center mb-4 ${!isOpen && 'hidden'}`}>
        <h2 className="text-xl font-bold">Podcast Mode</h2>
        <button onClick={onClose} className="text-red-700 hover:text-red-900">
          <X size={24} />
        </button>
      </div>
      <div className={`${!isOpen && 'hidden'}`}>
        <p>Podcast content will go here.</p>
      </div>
    </div>
  );
}
