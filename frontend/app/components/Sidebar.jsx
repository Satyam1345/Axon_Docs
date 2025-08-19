"use client"
import { PlusCircle, Loader2, FileText } from 'lucide-react';
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
    <aside className={`transition-all duration-300 ease-in-out flex-shrink-0 h-full bg-gradient-to-b from-red-50/95 to-red-100/95 backdrop-blur-sm border-r border-red-200/60 shadow-lg overflow-hidden ${isOpen ? 'w-48' : 'w-0'}`}>
      <div className={`${!isOpen && 'hidden'} h-full flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex-shrink-0 p-2 pb-1">
          <h2 className="text-sm font-bold bg-gradient-to-r from-red-700 to-red-800 bg-clip-text text-transparent mb-1">
            Documents
          </h2>
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-hidden px-2">
          <div className="flex-shrink-0 mb-2">
            <span className="text-xs font-medium text-red-600/80 uppercase tracking-wide">
              {documents.length} Doc{documents.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="h-full pb-2 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <li key={doc}>
                    <button
                      onClick={() => onPdfSelect?.(doc)}
                      className={`w-full text-left p-3 rounded-md border transition-all duration-200 group overflow-hidden ${
                        selectedPdf === doc 
                          ? 'bg-red-100/90 border-red-300/80 shadow-sm backdrop-blur-sm' 
                          : 'bg-white/60 border-red-200/50 hover:bg-red-50/80 hover:border-red-300/70 hover:shadow-sm backdrop-blur-sm'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <div className={`p-1 rounded-sm flex-shrink-0 mt-0.5 ${
                          selectedPdf === doc ? 'bg-red-200/70' : 'bg-red-100/60 group-hover:bg-red-200/70'
                        } transition-colors duration-200`}>
                          <FileText size={12} className="text-red-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-xs leading-relaxed break-words ${
                            selectedPdf === doc ? 'text-red-800' : 'text-red-700'
                          }`}>
                            {doc.replace('.pdf', '')}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-center py-4">
                  <div className="bg-white/60 backdrop-blur-sm border border-red-200/50 rounded-md p-3 overflow-hidden">
                    <FileText size={16} className="text-red-400 mx-auto mb-1" />
                    <p className="text-red-600/80 text-xs">No documents</p>
                    <p className="text-red-500/60 text-xs">Add files below</p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Add Files Button */}
        <div className="flex-shrink-0 p-2 pt-1 border-t border-red-200/50">
          <button
            onClick={handleAddClick}
            disabled={isAdding}
            className={`w-full py-2 px-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm text-xs overflow-hidden ${
              isAdding 
                ? 'bg-red-400/80 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-md active:scale-[0.98]'
            } text-white backdrop-blur-sm`}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                <span className="truncate">Processing...</span>
              </>
            ) : (
              <>
                <PlusCircle size={14} className="flex-shrink-0" />
                <span className="truncate">Add Files</span>
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFilesChange} />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 68, 68, 0.3) rgba(239, 68, 68, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(239, 68, 68, 0.1);
          border-radius: 1px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.3);
          border-radius: 1px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.5);
        }
        body {
          overflow-x: hidden;
        }
      `}</style>
    </aside>
  );
}

export default Sidebar;
