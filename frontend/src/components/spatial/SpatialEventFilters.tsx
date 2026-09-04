import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface SpatialEventFiltersProps {
  eventTypeFilter: string;
  epistemicFilter: string;
  onSetEventTypeFilter: (type: string) => void;
  onSetEpistemicFilter: (status: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  availableEventTypes: string[];
}

export const SpatialEventFilters: React.FC<SpatialEventFiltersProps> = ({
  eventTypeFilter,
  epistemicFilter,
  onSetEventTypeFilter,
  onSetEpistemicFilter,
  onClearFilters,
  filteredCount,
  totalCount,
  availableEventTypes
}) => {
  const isFiltered = eventTypeFilter !== 'ALL' || epistemicFilter !== 'ALL';

  return (
    <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-3 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-sans">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Event Type Filter */}
        <select
          value={eventTypeFilter}
          onChange={(e) => onSetEventTypeFilter(e.target.value)}
          className="bg-[#0e131d] border border-[#151d2a] text-slate-200 text-xs font-semibold rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#BD3535] shadow-sm cursor-pointer"
        >
          <option value="ALL">All Event Types</option>
          {availableEventTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Epistemic Status Filter */}
        <select
          value={epistemicFilter}
          onChange={(e) => onSetEpistemicFilter(e.target.value)}
          className="bg-[#0e131d] border border-[#151d2a] text-slate-200 text-xs font-semibold rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#BD3535] shadow-sm cursor-pointer"
        >
          <option value="ALL">All Epistemic Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROBABLE">PROBABLE</option>
          <option value="POSSIBLE">POSSIBLE</option>
          <option value="REFUTED">REFUTED</option>
        </select>

        {/* Clear Filters Button */}
        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center space-x-1 text-slate-300 hover:text-white bg-[#151d2a] hover:bg-[#26354a] border border-[#26354a] px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Dynamic Count Indicator */}
      <div className="font-mono text-xs text-slate-400">
        Showing <span className="font-bold text-white">{filteredCount}</span> of <span className="font-bold text-white">{totalCount}</span> spatial events
      </div>
    </div>
  );
};
