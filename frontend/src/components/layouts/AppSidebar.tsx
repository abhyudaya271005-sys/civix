import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Plus, 
  LayoutDashboard, 
  Folder, 
  Search, 
  MapPin,
  Video, 
  ShieldAlert, 
  Settings
} from 'lucide-react';

interface AppSidebarProps {
  onNewCaseClick?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ onNewCaseClick }) => {
  const location = useLocation();

  return (
    <aside className="w-56 bg-[#0a0d14] border-r border-[#151b28] flex flex-col flex-shrink-0 h-full select-none">
      {/* Top Primary Action */}
      <div className="p-3 border-b border-[#151b28] flex-shrink-0">
        <NavLink
          to="/cases"
          onClick={onNewCaseClick}
          className="w-full bg-[#962626] hover:bg-[#821f1f] text-white font-semibold text-xs py-2 px-3 rounded-xs flex items-center justify-center space-x-2 transition-colors shadow-xs cursor-pointer text-center"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span className="text-center">New Case</span>
        </NavLink>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto text-[12px] font-medium">
        {/* Command Center */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-[#BD3535] text-white font-semibold shadow-xs'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#0e131d]'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 text-white" />
          <span>Command Center</span>
        </NavLink>

        {/* Cases */}
        <NavLink
          to="/cases"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive || location.pathname.startsWith('/cases')
                ? 'bg-[#BD3535] text-white font-semibold shadow-xs'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#0e131d]'
            }`
          }
        >
          <Folder className="w-4 h-4 text-white" />
          <span>Cases</span>
        </NavLink>

        {/* Global Search */}
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-[#BD3535] text-white font-semibold shadow-xs'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#0e131d]'
            }`
          }
        >
          <Search className="w-4 h-4 text-[#64748b]" />
          <span>Search</span>
        </NavLink>

        {/* Spatial Intelligence */}
        <NavLink
          to="/spatial"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-[#BD3535] text-white font-semibold shadow-xs'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#0e131d]'
            }`
          }
        >
          <MapPin className="w-4 h-4 text-[#64748b]" />
          <span>Spatial Intelligence</span>
        </NavLink>

        {/* CCTV Analysis */}
        <NavLink
          to="/cctv"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'bg-[#BD3535] text-white font-semibold shadow-xs'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#0e131d]'
            }`
          }
        >
          <Video className="w-4 h-4 text-[#64748b]" />
          <span>CCTV</span>
        </NavLink>

        <div className="pt-2 pb-1 border-t border-[#151b28]/60 my-2"></div>

        <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-[#64748b] hover:text-[#94a3b8] cursor-pointer transition-colors">
          <ShieldAlert className="w-4 h-4 text-[#475569]" />
          <span>Audit Log</span>
        </div>

        <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-[#64748b] hover:text-[#94a3b8] cursor-pointer transition-colors">
          <Settings className="w-4 h-4 text-[#475569]" />
          <span>Settings</span>
        </div>
      </nav>

      {/* Sidebar Footer Motto */}
      <div className="p-4 border-t border-[#151b28] flex-shrink-0 flex items-center space-x-2.5">
        <div className="w-0.5 h-6 bg-[#BD3535] rounded-full"></div>
        <div className="text-[10px] font-mono leading-tight uppercase tracking-wider text-[#64748b]">
          Truth <br />
          Connects <br />
          The Dots
        </div>
      </div>
    </aside>
  );
};
