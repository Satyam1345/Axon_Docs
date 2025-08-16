"use client"
import { ChevronDown, FileText, Lightbulb, Link, BarChart, PlayCircle, Clock, History, PlusCircle } from 'lucide-react';
import LinkNext from 'next/link';


function Sidebar({ isOpen, data, history, onSectionSelect, onCollectionSelect, onPdfSelect, selectedPdf }) {
  if (!isOpen) return null;

  const pdfList = (data && data.documents) ? data.documents : [];

  return (
    <aside className="w-80 bg-slate-800/70 border-r border-slate-700 flex-shrink-0 flex flex-col">
      <div className="p-4 flex flex-col gap-4">
        <div className="group relative">
            <button className="w-full flex items-center justify-between p-2 bg-blue-600/20 rounded-md text-white">
                <span className="font-semibold truncate">{data.collectionName}</span>
                <ChevronDown size={20} />
            </button>
            <div className="absolute top-full mt-2 w-full bg-slate-700 rounded-md shadow-lg p-2 z-10 hidden group-hover:block">
                <h3 className="px-2 pb-2 text-xs font-semibold text-slate-400 border-b border-slate-600 flex items-center gap-2"><History size={14}/>Recent Collections</h3>
                <div className="max-h-48 overflow-y-auto mt-2">
                    {history.map(item => (
                        <a key={item._id} href="#" onClick={() => onCollectionSelect(item)} className="block p-2 text-sm rounded-md hover:bg-slate-600">{item.collectionName}</a>
                    ))}
                </div>
                <LinkNext href="/upload" className="flex items-center gap-2 mt-2 p-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white">
                    <PlusCircle size={16}/> New Analysis
                </LinkNext>
            </div>
        </div>
        {/* PDF List */}
        {pdfList.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2"><FileText size={14}/>PDFs in Collection</h3>
            <div className="flex flex-col gap-1">
              {pdfList.map(pdf => (
                <button
                  key={pdf}
                  onClick={() => onPdfSelect && onPdfSelect(pdf)}
                  className={`text-left px-2 py-1 rounded-md ${selectedPdf === pdf ? 'bg-blue-700 text-white' : 'hover:bg-slate-700 text-blue-300'}`}
                >
                  {pdf}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 space-y-6 flex-grow overflow-y-auto">
        {/* Key Insights, Highlighted Sections, etc. (same as before) */}
      </div>
    </aside>
  );
}

export default Sidebar;
