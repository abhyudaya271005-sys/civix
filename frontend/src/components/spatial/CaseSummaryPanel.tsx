import React from 'react';
import type { SpatialCaseFeature } from '../../api/spatial';
import { Target, ArrowRight, MapPin } from 'lucide-react';

interface CaseSummaryPanelProps {
  selectedCase: SpatialCaseFeature | null;
  onOpenEventMap: (caseId: string) => void;
  onInspectCase?: (caseId: string) => void;
}

export const CaseSummaryPanel: React.FC<CaseSummaryPanelProps> = ({
  selectedCase,
  onOpenEventMap,
  onInspectCase
}) => {
  if (!selectedCase) {
    return (
      <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-6 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
        <div className="w-12 h-12 rounded-full bg-[#151d2a] text-[#BD3535] flex items-center justify-center mb-3 border border-[#26354a]">
          <Target className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">No Case Selected</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          Select a case from the map or list to view case summary, events, and intelligence.
        </p>
      </div>
    );
  }

  const { case_id, case_number, title, status, priority, case_type, event_count, spatial_semantic } = selectedCase.properties;
  const [lon, lat] = selectedCase.geometry.coordinates;

  return (
    <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between border-b border-[#151d2a] pb-2 mb-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            CASE SUMMARY
          </h3>
          <span className="font-mono text-[10px] text-slate-400 font-semibold">{case_number}</span>
        </div>

        <h2 className="text-sm font-bold text-white leading-tight mb-2">
          {title}
        </h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
            priority === 'CRITICAL' ? 'bg-red-950/60 text-red-300 border border-red-800' :
            priority === 'HIGH' ? 'bg-orange-950/60 text-orange-300 border border-orange-800' :
            'bg-amber-950/60 text-amber-300 border border-amber-800'
          }`}>
            {priority}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-950/60 text-blue-300 border border-blue-800">
            {status}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#151d2a] text-slate-300 border border-[#26354a]">
            {case_type}
          </span>
        </div>

        {/* Dynamic Coordinates & Spatial Semantics */}
        <div className="bg-[#0e131d] rounded border border-[#151d2a] p-2.5 space-y-2 text-xs text-slate-300 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
              Footprint Centroid
            </span>
            <span className="font-mono text-[11px] font-semibold text-white">
              {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#151d2a] text-[10px]">
            <span className="text-slate-400">Semantic Tag:</span>
            <span className="font-mono font-semibold text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800">
              {spatial_semantic}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Spatially Grounded Events:</span>
            <span className="font-mono font-bold text-white bg-[#0b0e17] px-1.5 py-0.5 rounded border border-[#151d2a]">
              {event_count} {event_count === 1 ? 'event' : 'events'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary & Secondary Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onOpenEventMap(case_id)}
          className="w-full bg-[#BD3535] hover:bg-[#a32a2a] text-white font-semibold text-xs py-2.5 px-4 rounded flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
        >
          <span>SEE CASE EVENT MAP</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        {onInspectCase && (
          <button
            onClick={() => onInspectCase(case_id)}
            className="w-full bg-[#121824] hover:bg-[#1a2333] text-slate-300 hover:text-white font-semibold text-xs py-2 px-4 rounded flex items-center justify-center space-x-2 border border-[#1e293b] transition-colors cursor-pointer"
          >
            <span>OPEN CASE WORKSPACE</span>
          </button>
        )}
      </div>
    </div>
  );
};
