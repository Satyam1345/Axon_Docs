import { PanelLeftClose, PanelLeftOpen, Search, Lightbulb } from 'lucide-react';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-slate-700 bg-slate-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <h1 className="text-lg font-bold text-white">Axon Docs</h1>
      </div>
      <div className="flex items-center gap-4 flex-grow max-w-md">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search in document..."
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <Lightbulb size={20} className="text-yellow-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
