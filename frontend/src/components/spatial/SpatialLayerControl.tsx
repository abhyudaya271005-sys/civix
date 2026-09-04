import React from 'react';
import { Layers, MapPin, Navigation, Flame, Eye } from 'lucide-react';

interface SpatialLayerControlProps {
  layers: {
    footprints: boolean;
    eventLocations: boolean;
    routes: boolean;
    heatmap: boolean;
  };
  onToggleLayer: (layerKey: 'footprints' | 'eventLocations' | 'routes' | 'heatmap') => void;
  hasSelectedCase: boolean;
}

export const SpatialLayerControl: React.FC<SpatialLayerControlProps> = ({
  layers,
  onToggleLayer,
  hasSelectedCase
}) => {
  return (
    <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-[#151d2a] pb-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
          <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          SPATIAL LAYERS
        </h3>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Layer 1: Case Footprints */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 flex items-center truncate">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-400 flex-shrink-0" />
              Case Footprints
            </span>
            <span className="text-[10px] text-slate-500 pl-5 truncate">Case centroid locations</span>
          </div>
          <button
            onClick={() => onToggleLayer('footprints')}
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
              layers.footprints ? 'bg-[#BD3535]' : 'bg-slate-800'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
              layers.footprints ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Layer 2: Event Locations */}
        <div className={`flex items-center justify-between gap-2 ${!hasSelectedCase ? 'opacity-40' : ''}`}>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 flex items-center truncate">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-amber-400 flex-shrink-0" />
              Event Locations
            </span>
            <span className="text-[10px] text-slate-500 pl-5 truncate">
              {hasSelectedCase ? 'Spatial event points' : 'Requires case selection'}
            </span>
          </div>
          <button
            disabled={!hasSelectedCase}
            onClick={() => onToggleLayer('eventLocations')}
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
              layers.eventLocations && hasSelectedCase ? 'bg-[#BD3535]' : 'bg-slate-800'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
              layers.eventLocations && hasSelectedCase ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Layer 3: Movement Routes */}
        <div className={`flex items-center justify-between gap-2 ${!hasSelectedCase ? 'opacity-40' : ''}`}>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-200 flex items-center truncate">
              <Navigation className="w-3.5 h-3.5 mr-1.5 text-indigo-400 flex-shrink-0" />
              Movement Routes
            </span>
            <span className="text-[10px] text-slate-500 pl-5 truncate">
              {hasSelectedCase ? 'Route lines & trajectories' : 'Requires case selection'}
            </span>
          </div>
          <button
            disabled={!hasSelectedCase}
            onClick={() => onToggleLayer('routes')}
            className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
              layers.routes && hasSelectedCase ? 'bg-[#BD3535]' : 'bg-slate-800'
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
              layers.routes && hasSelectedCase ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Layer 4: Heatmap (Disabled) */}
        <div className="flex items-center justify-between gap-2 opacity-30 cursor-not-allowed">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-300 flex items-center truncate">
              <Flame className="w-3.5 h-3.5 mr-1.5 text-red-400 flex-shrink-0" />
              Heatmap (Events)
            </span>
            <span className="text-[10px] text-slate-500 pl-5 truncate">Event density visualization</span>
          </div>
          <button
            disabled
            className="w-9 h-5 rounded-full bg-slate-800 relative flex-shrink-0 cursor-not-allowed"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-slate-600 absolute top-0.5 left-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
