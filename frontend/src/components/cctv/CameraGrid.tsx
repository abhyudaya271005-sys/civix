import React from 'react';
import type { Camera } from '../../api/cctv';
import { MapPin, Search } from 'lucide-react';

interface CameraGridProps {
  cameras: Camera[];
  selectedCameraId: string | null;
  onCameraSelect: (cameraId: string) => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({ cameras, selectedCameraId, onCameraSelect }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCameras = cameras.filter(c => 
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.camera_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0b0e17] rounded border border-[#151d2a] shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#151d2a] bg-[#0e131d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-white text-sm">Camera Directory</h3>
          <span className="bg-[#151d2a] text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#26354a]">
            {filteredCameras.length}
          </span>
        </div>
        
        <div className="relative w-full sm:w-60">
          <input 
            type="text" 
            placeholder="Search by name or code..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-[#151d2a] rounded focus:outline-none focus:ring-1 focus:ring-[#BD3535] bg-[#07090e] text-white placeholder-slate-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-2.5 top-1.5 text-slate-400" size={12} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-[#07090e]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCameras.map(cam => {
            const isSelected = cam.camera_id === selectedCameraId;
            const isVerified = cam.status === 'LIVE' || cam.status === 'REGISTERED_ONLY';
            
            return (
              <div 
                key={cam.camera_id} 
                className={`border rounded cursor-pointer transition-all hover:shadow-sm overflow-hidden flex flex-col justify-between ${
                  isSelected ? 'bg-[#181116] border-[#BD3535] ring-1 ring-[#BD3535] shadow-sm' : 'bg-[#0e131d] border-[#151d2a] hover:border-[#26354a]'
                }`}
                onClick={() => onCameraSelect(cam.camera_id)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-white text-xs truncate pr-1" title={cam.display_name}>
                      {cam.display_name}
                    </h4>
                    {isVerified && (
                      <span className="bg-emerald-950/60 text-emerald-300 text-[8px] font-bold px-1 py-0.5 rounded uppercase border border-emerald-800 flex-shrink-0">
                        REACHABLE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cam.camera_code}</p>
                </div>
                
                <div className="px-3 py-2 bg-[#0b0e17] border-t border-[#151d2a] flex items-center justify-between">
                  <div className="flex items-center text-[10px] text-slate-400">
                    <MapPin size={10} className="mr-1 text-slate-500" />
                    <span>{cam.city}</span>
                  </div>
                  <button 
                    className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${
                      isSelected 
                        ? 'bg-[#BD3535] text-white' 
                        : 'bg-[#151d2a] text-slate-300 hover:bg-[#26354a] hover:text-white'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : 'INSPECT'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredCameras.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              No cameras match your search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
