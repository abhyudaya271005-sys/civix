import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';

interface AppHeaderProps {
  onSearchClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onSearchClick }) => {
  const navigate = useNavigate();

  // Workstation Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleSearchClick() {
    navigate('/search');
    if (onSearchClick) onSearchClick();
  }

  // Ctrl+K shortcut routes to the canonical SearchPage
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <header className="h-12 bg-[#0a0d14] border-b border-[#151b28] sticky top-0 z-30 flex items-center justify-between px-6 select-none">
      {/* Left: Branding & Government Identity */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#BD3535] shadow-[0_0_8px_#BD3535] group-hover:scale-110 transition-transform"></div>
          <span className="font-extrabold text-white text-sm tracking-wider font-sans">
            CIVIX
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#64748b] tracking-wider uppercase pl-2 border-l border-[#151b28] hidden sm:inline">
          Investigative Intelligence Workstation
        </span>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <button
          id="header-search-btn"
          type="button"
          onClick={handleSearchClick}
          aria-label="Open global search (Ctrl+K)"
          className="flex items-center w-full bg-[#0d121c] border border-[#1b2333] hover:border-[#2b374f] rounded-xs px-3 py-1.5 text-xs text-[#64748b] cursor-pointer transition-colors group"
        >
          <Search className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#94a3b8] mr-2 flex-shrink-0 transition-colors" />
          <span className="flex-1 truncate text-left text-[11px]">Search cases, entities, evidence, leads...</span>
          <span className="text-[9px] font-mono border border-[#1e293b] px-1 py-0.2 rounded text-[#475569] bg-[#07090e]">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Right: Clock & Analyst User Profile */}
      <div className="flex items-center space-x-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-bold text-white bg-[#0e131d] border border-[#1b2333] px-2.5 py-1 rounded-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BD3535] animate-pulse"></span>
          <span>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Alerts Notification */}
        <button
          onClick={() => navigate('/cases')}
          className="relative p-1.5 text-[#64748b] hover:text-white transition-colors"
          title="Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#BD3535] shadow-[0_0_6px_#BD3535]"></span>
        </button>

        {/* User Pill */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-[#151b28]">
          <div className="w-6 h-6 rounded-full bg-[#BD3535] text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
            A
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[12px] font-semibold text-white leading-tight">Analyst</span>
            <span className="text-[9px] font-mono text-[#64748b] leading-tight">Investigation Unit</span>
          </div>
          <ChevronDown className="w-3 h-3 text-[#64748b]" />
        </div>
      </div>
    </header>
  );
};
