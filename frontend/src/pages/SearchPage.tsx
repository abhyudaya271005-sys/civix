import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import type { SearchResultItem } from '../types/api';
import {
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  User,
  Building2,
  Smartphone,
  Phone,
  Car,
  CreditCard,
  Fingerprint,
  ChevronRight,
  Filter,
  Info,
} from 'lucide-react';

// ── Entity Type Configuration ────────────────────────────────────────────────

interface EntityTypeConfig {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
  matchHint: string;
}

const ENTITY_TYPE_CONFIG: Record<string, EntityTypeConfig> = {
  PERSON: {
    label: 'Person',
    shortLabel: 'PERSON',
    icon: User,
    iconClass: 'text-blue-400',
    badgeClass: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    matchHint: 'display_name (fuzzy)',
  },
  ORGANIZATION: {
    label: 'Organization',
    shortLabel: 'ORG',
    icon: Building2,
    iconClass: 'text-amber-400',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    matchHint: 'legal_name (fuzzy)',
  },
  DEVICE: {
    label: 'Device',
    shortLabel: 'DEVICE',
    icon: Smartphone,
    iconClass: 'text-purple-400',
    badgeClass: 'bg-purple-950/60 text-purple-300 border-purple-800/40',
    matchHint: 'IMEI or MAC (exact)',
  },
  PHONE_NUMBER: {
    label: 'Phone Number',
    shortLabel: 'PHONE',
    icon: Phone,
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
    matchHint: 'MSISDN (exact)',
  },
  VEHICLE: {
    label: 'Vehicle',
    shortLabel: 'VEHICLE',
    icon: Car,
    iconClass: 'text-red-400',
    badgeClass: 'bg-[#2d0e12] text-red-300 border-[#BD3535]/40',
    matchHint: 'registration number (exact)',
  },
  FINANCIAL_ACCOUNT: {
    label: 'Financial Account',
    shortLabel: 'FINANCIAL',
    icon: CreditCard,
    iconClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-950/60 text-yellow-300 border-yellow-800/40',
    matchHint: 'masked number (exact)',
  },
  SOURCE_IDENTITY: {
    label: 'Source Identity',
    shortLabel: 'SOURCE ID',
    icon: Fingerprint,
    iconClass: 'text-slate-400',
    badgeClass: 'bg-[#151d2a] text-slate-300 border-[#232f48]',
    matchHint: 'raw identifier (exact)',
  },
};

const ENTITY_TYPE_KEYS = Object.keys(ENTITY_TYPE_CONFIG);

function getEntityConfig(type: string): EntityTypeConfig {
  return ENTITY_TYPE_CONFIG[type?.toUpperCase()] ?? {
    label: type,
    shortLabel: type,
    icon: Fingerprint,
    iconClass: 'text-slate-400',
    badgeClass: 'bg-[#151d2a] text-slate-400 border-[#232f48]',
    matchHint: 'identifier',
  };
}

// ── Matched Field Label ──────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  display_name: 'Name',
  legal_name: 'Legal Name',
  imei: 'IMEI',
  mac_address: 'MAC Address',
  msisdn: 'MSISDN',
  registration_number: 'Reg. Number',
  raw_identifier: 'Identifier',
  masked_number: 'Account (masked)',
};

function friendlyField(field: string) {
  return FIELD_LABELS[field] || field;
}

// ── Match type badge ─────────────────────────────────────────────────────────

function MatchTypeBadge({ matchedField }: { matchedField: string }) {
  const isFuzzy = matchedField === 'display_name' || matchedField === 'legal_name';
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
      isFuzzy
        ? 'bg-[#261d0d] text-amber-400 border-amber-500/40'
        : 'bg-[#151d2a] text-slate-300 border-[#232f48]'
    }`}>
      {isFuzzy ? 'FUZZY' : 'EXACT'}
    </span>
  );
}

// ── Search Result Row ────────────────────────────────────────────────────────

interface SearchResultRowProps {
  result: SearchResultItem;
  onSelect: (result: SearchResultItem) => void;
  isSelected: boolean;
}

const SearchResultRow: React.FC<SearchResultRowProps> = ({ result, onSelect, isSelected }) => {
  const config = getEntityConfig(result.entity_type);
  const Icon = config.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      id={`result-${result.entity_id}`}
      onClick={() => onSelect(result)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(result)}
      className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors group focus:outline-none ${
        isSelected
          ? 'bg-[#BD3535]/10 border-[#BD3535]/40'
          : 'bg-[#0b0e17] border-[#151d2a] hover:bg-[#0e131d]'
      }`}
    >
      {/* Left: Type icon + identity */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Entity type icon badge */}
        <div className={`w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-[#2d0e12] border-[#BD3535]/60' : 'bg-[#080b12] border-[#1b2333] group-hover:border-slate-700'
        }`}>
          <Icon className={`w-4 h-4 ${config.iconClass}`} />
        </div>

        {/* Identity */}
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-semibold truncate ${isSelected ? 'text-white font-bold' : 'text-slate-100'}`}>
              {result.display_label}
            </span>
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#BD3535] flex-shrink-0" />}
          </div>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${config.badgeClass}`}>
              {config.shortLabel}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              matched: <span className="text-slate-200">{friendlyField(result.matched_field)}</span>
            </span>
            <MatchTypeBadge matchedField={result.matched_field} />
          </div>
        </div>
      </div>

      {/* Right: ID + action */}
      <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
        <span className="text-[10px] font-mono text-slate-500 hidden lg:block truncate max-w-[180px]">
          {result.entity_id}
        </span>
        <div className={`flex items-center space-x-1 text-[10px] font-bold font-mono transition-colors ${
          isSelected ? 'text-[#BD3535]' : 'text-slate-400 group-hover:text-blue-400'
        }`}>
          <span>Open Dossier</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#BD3535]" />
        </div>
      </div>
    </div>
  );
};

// ── Scope Filter Tabs ────────────────────────────────────────────────────────

interface ScopeFilterProps {
  activeType: string;
  onChange: (type: string) => void;
  resultCounts: Record<string, number>;
}

const ScopeFilterBar: React.FC<ScopeFilterProps> = ({ activeType, onChange, resultCounts }) => {
  const allCount = Object.values(resultCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        id="scope-all"
        onClick={() => onChange('')}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded font-mono transition-colors ${
          activeType === ''
            ? 'bg-[#BD3535] text-white'
            : 'bg-[#0e131d] text-slate-400 border border-[#1b2333] hover:bg-[#151d2a] hover:text-slate-200'
        }`}
      >
        <Filter className="w-3 h-3" />
        <span>All</span>
        {allCount > 0 && (
          <span className={`text-[9px] font-mono font-bold px-1 rounded ${
            activeType === '' ? 'bg-black/30 text-white' : 'bg-[#080b12] text-slate-300'
          }`}>{allCount}</span>
        )}
      </button>
      {ENTITY_TYPE_KEYS.map((type) => {
        const config = ENTITY_TYPE_CONFIG[type];
        const Icon = config.icon;
        const count = resultCounts[type] || 0;
        const active = activeType === type;
        return (
          <button
            key={type}
            id={`scope-${type.toLowerCase()}`}
            onClick={() => onChange(type)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded font-mono transition-colors ${
              active
                ? 'bg-[#BD3535] text-white'
                : 'bg-[#0e131d] text-slate-400 border border-[#1b2333] hover:bg-[#151d2a] hover:text-slate-200'
            }`}
          >
            <Icon className={`w-3 h-3 ${active ? 'text-white' : config.iconClass}`} />
            <span>{config.label}</span>
            {count > 0 && (
              <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                active ? 'bg-black/30 text-white' : 'bg-[#080b12] text-slate-300'
              }`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── Main SearchPage ──────────────────────────────────────────────────────────

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive state from URL params so the search is bookmarkable
  const urlQuery = searchParams.get('q') || '';
  const urlType = searchParams.get('type') || '';

  const [inputValue, setInputValue] = useState(urlQuery);
  const [committedQuery, setCommittedQuery] = useState(urlQuery);
  const [activeType, setActiveType] = useState(urlType);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce: commit the query after 400ms of inactivity
  useEffect(() => {
    if (!inputValue.trim()) {
      setCommittedQuery('');
      return;
    }
    if (inputValue.trim().length < 3) return;
    const timer = setTimeout(() => {
      setCommittedQuery(inputValue.trim());
      setSearchParams(
        { q: inputValue.trim(), ...(activeType ? { type: activeType } : {}) },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue, activeType, setSearchParams]);

  // Update URL when type filter changes
  const handleTypeChange = useCallback((type: string) => {
    setActiveType(type);
    setSelectedResultId(null);
    if (committedQuery) {
      setSearchParams(
        { q: committedQuery, ...(type ? { type } : {}) },
        { replace: true }
      );
    }
  }, [committedQuery, setSearchParams]);

  const canSearch = committedQuery.length >= 3;

  // Backend minimum query length is 3 characters
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['search', committedQuery, activeType],
    queryFn: () => searchApi.searchEntities(committedQuery, activeType || undefined, 50),
    enabled: canSearch,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  // Compute per-type counts from the results (without additional API calls)
  const resultCounts: Record<string, number> = {};
  if (data?.results) {
    for (const r of data.results) {
      resultCounts[r.entity_type] = (resultCounts[r.entity_type] || 0) + 1;
    }
  }

  function handleSelect(result: SearchResultItem) {
    setSelectedResultId(result.entity_id);
    navigate(`/entities/${result.entity_id}`);
  }

  function handleClear() {
    setInputValue('');
    setCommittedQuery('');
    setActiveType('');
    setSelectedResultId(null);
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  }

  const results = data?.results || [];
  const hasQuery = committedQuery.length >= 3;
  const tooShort = inputValue.length > 0 && inputValue.length < 3;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="pb-3 border-b border-[#151d2a]">
        <h1 className="text-xl font-extrabold text-white tracking-tight uppercase font-mono">Global Search</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Search persons, organizations, devices, phones, vehicles, accounts — across all accessible cases
        </p>
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="global-search-input"
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setSelectedResultId(null);
            }}
            placeholder="Search name, IMEI, MSISDN, registration number, account..."
            className="w-full pl-10 pr-10 py-2.5 border border-[#1b2333] rounded text-sm text-slate-200 bg-[#080b12] focus:outline-none focus:ring-1 focus:ring-[#BD3535] focus:border-[#BD3535] placeholder-slate-500"
          />
          {isFetching && (
            <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#BD3535] animate-spin" />
          )}
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimum length hint */}
        {tooShort && (
          <p className="text-xs text-slate-400 font-mono pl-1">
            Enter at least 3 characters to search.
          </p>
        )}

        {/* Scope filter */}
        {hasQuery && (
          <ScopeFilterBar
            activeType={activeType}
            onChange={handleTypeChange}
            resultCounts={resultCounts}
          />
        )}
      </div>

      {/* Search Intelligence Note */}
      {!hasQuery && !tooShort && (
        <div className="max-w-2xl bg-[#0b0e17] border border-[#151d2a] rounded p-4 space-y-3">
          <div className="flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">Search Intelligence</p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Results are scoped to entities visible under your investigative access (RLS enforced).</p>
                <p>The backend applies <span className="font-mono bg-[#080b12] border border-[#1b2333] px-1 rounded text-slate-300">FUZZY</span> matching for person names and organization names, and <span className="font-mono bg-[#080b12] border border-[#1b2333] px-1 rounded text-slate-300">EXACT</span> matching for technical identifiers (IMEI, MSISDN, registration numbers, account numbers).</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {Object.entries(ENTITY_TYPE_CONFIG).map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <div key={type} className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Icon className={`w-3.5 h-3.5 ${cfg.iconClass} flex-shrink-0`} />
                      <span>{cfg.label}</span>
                      <span className="text-[9px] font-mono text-slate-500">({cfg.matchHint})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {hasQuery && (
        <div className="bg-[#0b0e17] border border-[#151d2a] rounded overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 bg-[#0a0d14] border-b border-[#151d2a] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide font-mono">
                Search Results
              </h3>
              {!isLoading && (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {results.length === 0
                    ? 'No matches found'
                    : `${results.length} result${results.length !== 1 ? 's' : ''} · query: "${committedQuery}"`}
                  {activeType && ` · filtered: ${getEntityConfig(activeType).label}`}
                </p>
              )}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-14 space-x-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#BD3535]" />
              <span className="text-xs font-mono">Searching entity registry...</span>
            </div>
          )}

          {/* API error */}
          {!isLoading && error && (
            <div className="py-12 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wide font-mono">Search Unavailable</p>
                <p className="text-xs text-slate-400 mt-1">
                  Unable to reach the investigation search service.
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#BD3535] hover:bg-[#a32828] rounded transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* No results */}
          {!isLoading && !error && results.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No entities found for this query.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeType
                  ? `No ${getEntityConfig(activeType).label} entities matched "${committedQuery}". Try removing the type filter.`
                  : `No entities matched "${committedQuery}". For technical identifiers (IMEI, MSISDN), use exact values.`}
              </p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !error && results.length > 0 && (
            <>
              {results.map((result) => (
                <SearchResultRow
                  key={result.entity_id}
                  result={result}
                  onSelect={handleSelect}
                  isSelected={result.entity_id === selectedResultId}
                />
              ))}
              {/* Pagination note */}
              <div className="px-4 py-2 bg-[#0a0d14] border-t border-[#151d2a]">
                <p className="text-[10px] font-mono text-slate-500">
                  Showing up to {data?.limit} results (offset: {data?.offset}). Refine query to narrow results.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
