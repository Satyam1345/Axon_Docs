"use client"
import { PanelLeftClose, PanelLeftOpen, LogOut, Mic, Brain } from 'lucide-react';

function Header({ isSidebarOpen, toggleSidebar, onLogout, onTogglePodcast, onToggleInsights }) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-red-700 bg-white flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-red-100">
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <h1 className="text-lg font-bold text-red-700">Axon Docs</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onTogglePodcast} className="p-2 rounded-md hover:bg-red-100">
          <Mic size={20} className="text-red-700" />
        </button>
        <button onClick={onToggleInsights} className="p-2 rounded-md hover:bg-red-100">
          <Brain size={20} className="text-blue-700" />
        </button>
        <button onClick={onLogout} className="p-2 rounded-md hover:bg-red-100">
          <LogOut size={20} className="text-red-700" />
        </button>
      </div>
    </header>
  );
}

export default Header;
