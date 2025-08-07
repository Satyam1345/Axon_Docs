import { ChevronDown, FileText, Lightbulb, Link, BarChart, PlayCircle, Clock } from 'lucide-react';
import { AnalysisData } from '@/app/types';

interface SidebarProps {
  isOpen: boolean;
  data: AnalysisData;
  onSectionSelect: (doc: string, page: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, data, onSectionSelect }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-80 bg-slate-800/70 border-r border-slate-700 flex-shrink-0 flex flex-col overflow-y-auto">
      <div className="p-4">
        <button className="w-full flex items-center justify-between p-2 bg-blue-600/20 rounded-md text-white">
          <span className="font-semibold">{data.collectionName}</span>
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="px-4 space-y-6 flex-grow">
        {/* Documents List */}
        <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase text-slate-400 px-2">Documents</h3>
            {data.documents.map((doc, i) => (
                <a key={i} href="#" onClick={() => onSectionSelect(doc, 1)} className="flex items-center gap-2 p-2 rounded-md text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                    <FileText size={16} />
                    <span>{doc}</span>
                </a>
            ))}
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-slate-400 px-2 flex items-center gap-2"><Lightbulb size={14}/>Key Insights</h3>
          {data.keyInsights.map((insight, i) => (
            <div key={i} className="text-sm p-3 bg-slate-700/50 rounded-md border-l-2 border-yellow-400">
              <p className="text-slate-300">{insight.content}</p>
            </div>
          ))}
        </div>

        {/* Highlighted Sections */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-slate-400 px-2 flex items-center gap-2"><BarChart size={14}/>Highlighted Sections</h3>
          {data.highlightedSections.map((section, i) => (
            <a key={i} href="#" onClick={() => onSectionSelect(section.document, section.page)} className="block p-3 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-400">{section.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{section.summary}</p>
                </div>
                <span className="text-xs font-mono bg-slate-600 px-1.5 py-0.5 rounded-sm">p.{section.page}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Related Sections */}
         <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-slate-400 px-2 flex items-center gap-2"><Link size={14}/>Related Sections</h3>
          {data.relatedSections.map((section, i) => (
            <a key={i} href="#" onClick={() => onSectionSelect(section.document, section.page)} className="block p-3 bg-slate-700/50 rounded-md hover:bg-slate-700 transition-colors">
                <p className="font-semibold text-purple-400">{section.title}</p>
                <p className="text-xs text-slate-400 mt-1">{section.summary}</p>
            </a>
          ))}
        </div>

        {/* Podcast Mode */}
        <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-slate-400 px-2 flex items-center gap-2"><PlayCircle size={14}/>Podcast Mode</h3>
            <div className="p-3 bg-slate-700/50 rounded-md">
                <p className="font-semibold text-green-400">Generate Audio Overview</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1"><Clock size={12}/>Estimated: 2-5 min</p>
                <button className="w-full mt-3 bg-green-600/80 hover:bg-green-600 text-white font-bold py-2 rounded-md flex items-center justify-center gap-2 transition-colors">
                    <PlayCircle size={16}/>
                    <span>Generate & Play</span>
                </button>
            </div>
        </div>
      </div>
      
      <div className="p-4 mt-4 border-t border-slate-700 text-center text-xs text-slate-500">
        <p>Tip: Press Ctrl/Cmd + B to toggle the sidebar</p>
      </div>
    </aside>
  );
};

export default Sidebar;