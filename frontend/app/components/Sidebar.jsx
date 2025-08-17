"use client"
import { PlusCircle, Loader2 } from 'lucide-react';
import React, { useRef } from 'react';


function Sidebar({ isOpen, documents = [], onPdfSelect, selectedPdf, onAddFiles, isAdding }) {
  const fileInputRef = useRef(null);
  const handleAddClick = () => fileInputRef.current?.click();
  const handleFilesChange = (e) => {
    const files = e.target.files && Array.from(e.target.files);
    if (files && files.length && onAddFiles) onAddFiles(files);
    e.target.value = null;
  };
  return (
    <aside className={`transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col p-4 border-r bg-red-50 border-red-700 ${isOpen ? 'w-64' : 'w-0'}`}>
      <div className={`${!isOpen && 'hidden'}`}>
        <h2 className="text-lg font-bold text-red-700 mb-3">Documents</h2>
        <ul className="flex flex-col gap-1 flex-grow overflow-y-auto">
          {documents.map((doc) => (
            <li
              key={doc}
              onClick={() => onPdfSelect?.(doc)}
              className={`cursor-pointer px-2 py-1 rounded ${selectedPdf === doc ? 'bg-red-700 text-white' : 'hover:bg-red-100 text-red-700'}`}
            >
              {doc}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <button
            onClick={handleAddClick}
            disabled={isAdding}
            className={`w-full py-2 rounded flex items-center justify-center gap-2 ${isAdding ? 'bg-red-500 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'} text-white`}
          >
            {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle size={16} />}
            {isAdding ? 'Processing...' : 'Add Files'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFilesChange} />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
