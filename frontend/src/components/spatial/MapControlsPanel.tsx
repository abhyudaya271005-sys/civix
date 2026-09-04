import React from 'react';
import { Maximize2, RotateCcw, Download } from 'lucide-react';

interface MapControlsPanelProps {
  onFitViewport: () => void;
  onResetLayers: () => void;
  onExportView: () => void;
}

export const MapControlsPanel: React.FC<MapControlsPanelProps> = ({
  onFitViewport,
  onResetLayers,
  onExportView
}) => {
  return (
    <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 shadow-sm space-y-3">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-[#151d2a] pb-2">
        MAP CONTROLS
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onFitViewport}
          className="flex items-center justify-center space-x-1.5 bg-[#0e131d] hover:bg-[#151d2a] text-slate-200 text-xs font-semibold py-2 px-3 rounded border border-[#151d2a] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Fit to Viewport</span>
        </button>

        <button
          onClick={onResetLayers}
          className="flex items-center justify-center space-x-1.5 bg-[#0e131d] hover:bg-[#151d2a] text-slate-200 text-xs font-semibold py-2 px-3 rounded border border-[#151d2a] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Layers</span>
        </button>
      </div>

      <button
        onClick={onExportView}
        className="w-full flex items-center justify-center space-x-1.5 bg-[#0e131d] hover:bg-[#151d2a] text-slate-200 text-xs font-semibold py-2 px-3 rounded border border-[#151d2a] transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span>Export Map View</span>
      </button>
    </div>
  );
};
