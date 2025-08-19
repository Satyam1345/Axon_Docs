"use client"
import { PanelLeftClose, PanelLeftOpen, LogOut, Mic, Brain, PanelBottom, PanelBottomClose } from 'lucide-react';

function Header({ isSidebarOpen, toggleSidebar, onLogout, onTogglePodcast, onToggleInsights, onToggleBottom, isBottomOpen }) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-red-50/90 to-red-100/90 backdrop-blur-sm border-b border-red-200/50 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-6">
        <div className="group relative">
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-red-200/70 hover:bg-red-50/80 hover:border-red-300/80 transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            {isSidebarOpen ? <PanelLeftClose size={18} className="text-red-700" /> : <PanelLeftOpen size={18} className="text-red-700" />}
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative overflow-hidden flex flex-row cursor-pointer">
            <div className="text-3xl font-black bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-red flex">
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '0ms'}}>A</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '300ms'}}>d</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '600ms'}}>o</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '900ms'}}>b</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '1200ms'}}>e</span>
            </div>
            <span className='p-2'></span>
            <div className="text-3xl font-black bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-red flex">
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '600ms'}}>P</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '900ms'}}>D</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '1200ms'}}>F</span>
            </div>
            <span className='p-2'></span>
            <div className="text-3xl font-black bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-red flex">
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '300ms'}}>L</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '600ms'}}>i</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '900ms'}}>f</span>
              <span className="inline-block transition-transform hover:scale-110 duration-300" style={{animation: 'subtleShake 4s ease-in-out infinite', animationDelay: '1200ms'}}>e</span>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="group relative">
          <button 
            onClick={onToggleBottom} 
            className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-red-200/70 hover:bg-red-50/80 hover:border-red-300/80 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isBottomOpen ? <PanelBottomClose size={18} className="text-red-700" /> : <PanelBottom size={18} className="text-red-700" />}
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {isBottomOpen ? 'Hide highlights panel' : 'Show highlights panel'}
          </div>
        </div>
        
        <div className="group relative">
          <button 
            onClick={onTogglePodcast} 
            className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-red-200/70 hover:bg-red-50/80 hover:border-red-300/80 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Mic size={18} className="text-red-700" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Generate podcast
          </div>
        </div>
        
        <div className="group relative">
          <button 
            onClick={onToggleInsights} 
            className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-red-200/70 hover:bg-red-50/80 hover:border-red-300/80 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Brain size={18} className="text-red-700" />
          </button>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Generate AI insights
          </div>
        </div>
        
        {onLogout && (
          <div className="group relative">
            <button 
              onClick={onLogout} 
              className="p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-red-200/70 hover:bg-red-50/80 hover:border-red-300/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut size={18} className="text-red-700" />
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 text-white text-xs rounded-md border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Sign out
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes subtleShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-0.5px); }
          75% { transform: translateX(0.5px); }
        }
      `}</style>
    </header>
  );
}

export default Header;
