import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isCommandCenter = location.pathname === '/' || location.pathname === '/command-center';

  // The Command Center / Dashboard page has its own dedicated desktop workstation shell
  // matching the reference design (custom left sidebar, thin header, dark background, etc.)
  if (isCommandCenter) {
    return (
      <div className="h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-[#BD3535] selection:text-white overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-[#BD3535] selection:text-white overflow-hidden">
      {/* Institutional Top Header - Sticky & Fixed */}
      <AppHeader />

      {/* Main Layout Body */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Left Sidebar - Fixed to viewport */}
        <AppSidebar />

        {/* Main Workspace Area - Independently scrollable */}
        <main className="flex-1 p-5 overflow-y-auto bg-[#07090e] flex flex-col">
          <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>

      {/* Footer - Fixed at bottom */}
      <footer className="bg-[#0a0d14] border-t border-[#151b28] px-6 py-1.5 text-center text-[10px] text-[#64748b] font-mono flex-shrink-0">
        CIVIX 2.0 — LAW ENFORCEMENT INTELLIGENCE PLATFORM — STRICT RLS & DOMAIN ISOLATION ENFORCED
      </footer>
    </div>
  );
};
