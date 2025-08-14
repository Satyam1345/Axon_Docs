// app/components/Header.tsx
"use client";
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-slate-700 bg-slate-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-slate-700">
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <h1 className="text-lg font-bold">Axon Docs</h1>
      </div>
      <button onClick={logout} className="p-2 rounded-md hover:bg-slate-700">
        <LogOut size={20} className="text-red-400" />
      </button>
    </header>
  );
};

export default Header;
