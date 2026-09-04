import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import { leadsApi } from '../api/leads';
import { evidenceApi } from '../api/evidence';
import { graphApi } from '../api/graph';
import { useCaseSelection } from '../context/CaseSelectionContext';
import { Badge } from '../components/ui/Badge';
import { LeadReviewModal } from '../components/domain/LeadReviewModal';
import type { InvestigativeLeadResponse } from '../types/api';
import {
  ArrowLeft,
  Briefcase,
  Users,
  FileText,
  Sparkles,
  GitFork,
  Loader2,
  AlertTriangle,
  Upload,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  MapPin,
  Car,
  Building,
  User,
  Phone
} from 'lucide-react';

const STATUS_VARIANTS: Record<string, string> = {
  OPEN: 'active',
  ACTIVE: 'confirmed',
  CLOSED: 'closed',
  ARCHIVED: 'deferred',
  SUSPENDED: 'warning',
};
const PRIORITY_VARIANTS: Record<string, string> = {
  HIGH: 'critical',
  CRITICAL: 'critical',
  MEDIUM: 'warning',
  LOW: 'default',
};

type WorkspaceTab = 'overview' | 'entities' | 'evidence' | 'leads' | 'graph';

export const CaseWorkspacePage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setSelectedCaseId } = useCaseSelection();
  const queryClient = useQueryClient();

  const activeTab = (searchParams.get('tab') as WorkspaceTab) || 'overview';

  // Sub-entity search & filter states
  const [entitySearch, setEntitySearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');

  // Leads review modal & generation states
  const [reviewLead, setReviewLead] = useState<InvestigativeLeadResponse | null>(null);

  // Evidence upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState('FIELD_COLLECTION');
  const [uploadContext, setUploadContext] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Sync selected case context on load
  React.useEffect(() => {
    if (caseId) setSelectedCaseId(caseId);
  }, [caseId, setSelectedCaseId]);

  function handleTabChange(tab: WorkspaceTab) {
    setSearchParams({ tab });
  }

  function handleBack() {
    navigate('/cases');
  }

  // 1. Fetch Case Core Data
  const { data: caseData, isLoading: isCaseLoading, error: caseError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => (caseId ? casesApi.getCase(caseId) : Promise.reject(new Error('No case ID'))),
    enabled: !!caseId,
    retry: 1,
  });

  // 2. Fetch Leads Specific to this Case
  const {
    data: leads = [],
    isLoading: isLeadsLoading,
    refetch: refetchLeads
  } = useQuery({
    queryKey: ['caseLeads', caseId],
    queryFn: () => (caseId ? leadsApi.getCaseLeads(caseId) : Promise.resolve([])),
    enabled: !!caseId,
  });

  // 3. Fetch Evidence Specific to this Case
  const {
    data: evidence = [],
    isLoading: isEvidenceLoading,
    refetch: refetchEvidence
  } = useQuery({
    queryKey: ['caseEvidence', caseId],
    queryFn: () => (caseId ? evidenceApi.listEvidence(caseId) : Promise.resolve([])),
    enabled: !!caseId,
  });

  // 4. Fetch Graph & Entities Specific to this Case
  const {
    data: graphData,
    isLoading: isGraphLoading
  } = useQuery({
    queryKey: ['caseGraph', caseId],
    queryFn: () => (caseId ? graphApi.getCaseGraph(caseId, 2, 200, 500) : Promise.resolve(null)),
    enabled: !!caseId,
  });

  // Mutations
  const generateLeadsMutation = useMutation({
    mutationFn: () => (caseId ? leadsApi.generateLeads(caseId) : Promise.reject(new Error('No case'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseLeads', caseId] });
      refetchLeads();
    },
  });

  const uploadEvidenceMutation = useMutation({
    mutationFn: async () => {
      if (!caseId || !uploadFile) throw new Error('File required');
      return evidenceApi.uploadEvidence(caseId, uploadFile, uploadMethod, uploadContext);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseEvidence', caseId] });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadContext('');
      refetchEvidence();
    },
  });

  // Extract Unique Entities from Graph
  const entitiesList = useMemo(() => {
    if (!graphData?.nodes) return [];
    const list: Array<{
      id: string;
      label: string;
      name: string;
      role?: string;
      properties: Record<string, any>;
    }> = [];

    graphData.nodes.forEach((node) => {
      // Exclude case node
      if (node.id === caseId || node.properties?.case_id === caseId || node.labels?.includes('Case')) {
        return;
      }
      const primaryLabel = node.labels?.[0] || 'Entity';
      const name =
        node.properties?.name ||
        node.properties?.title ||
        node.properties?.plate_number ||
        node.properties?.phone_number ||
        node.properties?.location_name ||
        node.id;

      list.push({
        id: node.properties?.entity_id || node.id,
        label: primaryLabel,
        name,
        role: node.properties?.role || node.properties?.case_role,
        properties: node.properties || {},
      });
    });

    return list;
  }, [graphData, caseId]);

  // Filtered Entities
  const filteredEntities = useMemo(() => {
    return entitiesList.filter((ent) => {
      const matchesSearch =
        !entitySearch ||
        ent.name.toLowerCase().includes(entitySearch.toLowerCase()) ||
        ent.label.toLowerCase().includes(entitySearch.toLowerCase());
      const matchesType =
        entityTypeFilter === 'ALL' || ent.label.toUpperCase() === entityTypeFilter.toUpperCase();
      return matchesSearch && matchesType;
    });
  }, [entitiesList, entitySearch, entityTypeFilter]);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    entitiesList.forEach((e) => set.add(e.label.toUpperCase()));
    return Array.from(set);
  }, [entitiesList]);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  }

  function getEntityIcon(label: string) {
    const l = label.toUpperCase();
    if (l.includes('PERSON') || l.includes('SUSPECT') || l.includes('WITNESS')) return <User className="w-4 h-4 text-blue-600" />;
    if (l.includes('ORG') || l.includes('COMPANY') || l.includes('BANK')) return <Building className="w-4 h-4 text-purple-600" />;
    if (l.includes('VEHICLE') || l.includes('CAR')) return <Car className="w-4 h-4 text-emerald-600" />;
    if (l.includes('LOCATION') || l.includes('PLACE') || l.includes('ADDRESS')) return <MapPin className="w-4 h-4 text-rose-600" />;
    if (l.includes('PHONE') || l.includes('COMM')) return <Phone className="w-4 h-4 text-amber-600" />;
    return <Users className="w-4 h-4 text-slate-500" />;
  }

  if (isCaseLoading) {
    return (
      <div className="flex items-center justify-center py-28 space-x-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-[#BD3535]" />
        <span className="text-xs font-mono">Loading case workspace...</span>
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="py-16 text-center space-y-4 bg-[#0b0e17] border border-[#151d2a] rounded p-8">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wide font-mono">Case Not Found</p>
          <p className="text-xs text-slate-400 mt-1">
            Case ID <span className="font-mono text-slate-200">{caseId}</span> could not be retrieved or is restricted.
          </p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#BD3535] hover:bg-[#a32828] rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Case Registry</span>
        </button>
      </div>
    );
  }

  const statusVariant = STATUS_VARIANTS[caseData.status?.toUpperCase()] || 'default';
  const priorityVariant = PRIORITY_VARIANTS[caseData.priority?.toUpperCase()] || 'default';

  return (
    <div className="space-y-5">
      {/* 1. Header Bar with Case Context & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#151d2a] gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cases</span>
            </button>
            <span className="text-[#1b2333]">/</span>
            <h1 className="text-xl font-extrabold text-white tracking-tight uppercase font-mono">
              {caseData.case_number}
            </h1>
            <Badge variant={statusVariant as any}>{caseData.status}</Badge>
            <Badge variant={priorityVariant as any}>{caseData.priority}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{caseData.title}</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 bg-[#0b0e17] border border-[#151d2a] px-3 py-1.5 rounded">
            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-200">{caseData.jurisdiction}</span>
            <span className="text-[#232f48]">·</span>
            <span className="text-slate-400">{caseData.case_type}</span>
          </div>

          <button
            onClick={() => navigate(`/cases/${caseId}/graph`)}
            className="flex items-center space-x-1.5 bg-[#151d2a] hover:bg-[#1b2333] text-slate-200 border border-[#232f48] px-3 py-1.5 rounded text-xs font-semibold transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-amber-500" />
            <span>Open Graph</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Tabs Navigation */}
      <div className="flex border-b border-[#151d2a] bg-[#0a0d14] rounded-t px-2 pt-2">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-mono ${
            activeTab === 'overview'
              ? 'border-[#BD3535] text-white bg-[#BD3535]/10'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-500" />
          <span>Case Overview</span>
        </button>

        <button
          onClick={() => handleTabChange('entities')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-mono ${
            activeTab === 'entities'
              ? 'border-[#BD3535] text-white bg-[#BD3535]/10'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Entities</span>
          <span className="bg-blue-950/60 border border-blue-800/50 text-blue-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
            {entitiesList.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('evidence')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-mono ${
            activeTab === 'evidence'
              ? 'border-[#BD3535] text-white bg-[#BD3535]/10'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Evidence</span>
          <span className="bg-amber-950/60 border border-amber-800/50 text-amber-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
            {evidence.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('leads')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-mono ${
            activeTab === 'leads'
              ? 'border-[#BD3535] text-white bg-[#BD3535]/10'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Leads</span>
          <span className="bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('graph')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer font-mono ${
            activeTab === 'graph'
              ? 'border-[#BD3535] text-white bg-[#BD3535]/10'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <GitFork className="w-4 h-4 text-emerald-400" />
          <span>Investigation Graph</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 1: CASE OVERVIEW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => handleTabChange('entities')}
              className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 hover:border-[#BD3535]/60 hover:bg-[#0e131d] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Associated Entities
                </span>
                <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {entitiesList.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1 font-mono">
                <span>Persons, orgs, vehicles linked</span>
                <ChevronRight className="w-3 h-3 text-[#BD3535]" />
              </p>
            </div>

            <div
              onClick={() => handleTabChange('evidence')}
              className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 hover:border-[#BD3535]/60 hover:bg-[#0e131d] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Evidence Artifacts
                </span>
                <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {evidence.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1 font-mono">
                <span>Ingested files & recordings</span>
                <ChevronRight className="w-3 h-3 text-[#BD3535]" />
              </p>
            </div>

            <div
              onClick={() => handleTabChange('leads')}
              className="bg-[#0b0e17] border border-[#151d2a] rounded p-4 hover:border-[#BD3535]/60 hover:bg-[#0e131d] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Investigative Leads
                </span>
                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {leads.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1 font-mono">
                <span>C3 AI-generated leads</span>
                <ChevronRight className="w-3 h-3 text-[#BD3535]" />
              </p>
            </div>
          </div>

          {/* Detailed Case Metadata */}
          <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-[#151d2a] pb-2 font-mono">
              Case Specifications & Investigation Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Case Number</p>
                <p className="text-xs font-mono font-bold text-[#BD3535] mt-0.5">{caseData.case_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Jurisdiction</p>
                <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">{caseData.jurisdiction}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Priority Tier</p>
                <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">{caseData.priority}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Investigation Status</p>
                <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">{caseData.status}</p>
              </div>
            </div>

            {(caseData as any).description && (
              <div className="pt-3 border-t border-[#151d2a]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                  Incident Narrative / Summary
                </p>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#080b12] p-3.5 rounded border border-[#151d2a] font-sans">
                  {(caseData as any).description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SPECIFIC ENTITIES FOR THIS CASE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'entities' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-80">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search case entities..."
                  value={entitySearch}
                  onChange={(e) => setEntitySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#080b12] border border-[#1b2333] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#BD3535] focus:ring-1 focus:ring-[#BD3535]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setEntityTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors font-mono ${
                  entityTypeFilter === 'ALL'
                    ? 'bg-[#BD3535] text-white'
                    : 'bg-[#0e131d] border border-[#1b2333] text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({entitiesList.length})
              </button>
              {entityTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityTypeFilter(type)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors font-mono ${
                    entityTypeFilter === type
                      ? 'bg-[#BD3535] text-white'
                      : 'bg-[#0e131d] border border-[#1b2333] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Grid */}
          {isGraphLoading ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#BD3535] mb-2" />
              <p className="text-xs font-mono">Extracting entities from case graph...</p>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No entities found for this case.</p>
              <p className="text-[11px] text-slate-500">
                Entities are extracted from evidence, FIRs, and investigative graph relationships.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="bg-[#0b0e17] border border-[#151d2a] hover:border-[#BD3535]/60 hover:bg-[#0e131d] rounded p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="p-1.5 rounded bg-[#080b12] border border-[#1b2333] flex-shrink-0">
                          {getEntityIcon(entity.label)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={entity.name}>
                            {entity.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {entity.label}
                          </span>
                        </div>
                      </div>

                      {entity.role && (
                        <span className="text-[9px] font-mono font-bold bg-[#2d0e12] text-red-300 border border-[#BD3535]/40 px-1.5 py-0.5 rounded flex-shrink-0">
                          {entity.role}
                        </span>
                      )}
                    </div>

                    {/* Properties preview */}
                    <div className="mt-3 pt-2.5 border-t border-[#151d2a] space-y-1 text-[11px] font-mono text-slate-400">
                      {Object.entries(entity.properties)
                        .filter(([k]) => !['name', 'title', 'entity_id', 'case_id', 'labels'].includes(k))
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between truncate">
                            <span className="text-slate-500 uppercase text-[9px]">{k}:</span>
                            <span className="truncate max-w-[140px] text-slate-200">{String(v)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#151d2a] flex items-center justify-end">
                    <button
                      onClick={() => navigate(`/entities/${entity.id}`)}
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors font-mono"
                    >
                      <span>Open Dossier</span>
                      <ChevronRight className="w-3 h-3 text-[#BD3535]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPECIFIC EVIDENCE FOR THIS CASE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Case Evidence Chain & Artifacts
              </span>
              <span className="text-xs font-mono text-slate-400">({evidence.length} records)</span>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-1.5 bg-[#BD3535] hover:bg-[#a32828] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Evidence</span>
            </button>
          </div>

          {isEvidenceLoading ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#BD3535] mb-2" />
              <p className="text-xs font-mono">Loading evidence artifacts...</p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No evidence artifacts uploaded yet.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Attach digital evidence, documents, CCTV excerpts, or forensic exports to this case.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-1.5 bg-[#BD3535] hover:bg-[#a32828] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Artifact</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#151d2a] bg-[#0a0d14] text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-4">Artifact / Filename</th>
                    <th className="py-2.5 px-3">MIME / Type</th>
                    <th className="py-2.5 px-3">Acquisition Method</th>
                    <th className="py-2.5 px-3">SHA-256 Hash</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151d2a] font-sans">
                  {evidence.map((item) => (
                    <tr key={item.artifact_id} className="hover:bg-[#0e131d] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <FileCode className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-xs">{item.original_filename || 'Evidence File'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          ID: {item.artifact_id}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {item.mime_type || 'binary/stream'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] font-mono font-semibold bg-[#080b12] text-slate-300 px-2 py-0.5 rounded border border-[#1b2333]">
                          {(item as any).acquisition_method || 'FIELD_COLLECTION'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <span>{(item as any).sha256_hash ? `${(item as any).sha256_hash.slice(0, 10)}...` : 'SHA-256'}</span>
                          {(item as any).sha256_hash && (
                            <button
                              onClick={() => copyToClipboard((item as any).sha256_hash, item.artifact_id)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="Copy SHA-256"
                            >
                              {copiedHash === item.artifact_id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                            item.processing_status === 'COMPLETED' || item.processing_status === 'PROCESSED'
                              ? 'bg-[#0b1f14] text-emerald-400 border-emerald-500/40'
                              : item.processing_status === 'PROCESSING'
                              ? 'bg-[#261d0d] text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-[#151d2a] text-slate-300 border-[#232f48]'
                          }`}
                        >
                          {item.processing_status || 'INGESTED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SPECIFIC LEADS FOR THIS CASE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Investigative Leads Engine
              </span>
              <span className="text-xs font-mono text-slate-400">({leads.length} generated)</span>
            </div>

            <button
              onClick={() => generateLeadsMutation.mutate()}
              disabled={generateLeadsMutation.isPending}
              className="flex items-center space-x-1.5 bg-[#BD3535] hover:bg-[#a32828] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {generateLeadsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Generate AI Leads</span>
            </button>
          </div>

          {isLeadsLoading ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#BD3535] mb-2" />
              <p className="text-xs font-mono">Querying case leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No leads generated for this case yet.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Trigger the C3 Intelligence Engine to infer identity links, movement patterns, and anomalies.
              </p>
              <button
                onClick={() => generateLeadsMutation.mutate()}
                disabled={generateLeadsMutation.isPending}
                className="inline-flex items-center space-x-1.5 bg-[#BD3535] hover:bg-[#a32828] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Run C3 Analysis Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const confidencePct = lead.ai_confidence ? Math.round(lead.ai_confidence * 100) : 75;
                return (
                  <div
                    key={lead.lead_id}
                    className="bg-[#0b0e17] border border-[#151d2a] hover:border-[#BD3535]/50 rounded p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#131b2c] text-blue-300 border border-blue-700/40">
                          {(lead as any).lead_type || 'INVESTIGATIVE_LEAD'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {lead.lead_id.slice(0, 8)}...
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                            lead.status === 'CONFIRMED'
                              ? 'bg-[#0b1f14] text-emerald-400 border-emerald-500/40'
                              : lead.status === 'REJECTED'
                              ? 'bg-[#2d0e12] text-red-400 border-[#BD3535]/40'
                              : 'bg-[#261d0d] text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-100 leading-snug">
                        {lead.lead_text}
                      </p>

                      <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <span>Confidence:</span>
                          <span className="font-bold text-slate-200">{confidencePct}%</span>
                          <div className="w-16 h-1.5 bg-[#151d2a] rounded-full overflow-hidden border border-[#1b2333]">
                            <div
                              className="h-full bg-[#BD3535] rounded-full"
                              style={{ width: `${confidencePct}%` }}
                            />
                          </div>
                        </div>
                        {lead.priority && (
                          <>
                            <span className="text-[#1b2333]">•</span>
                            <span>Priority: {lead.priority}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setReviewLead(lead)}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-[#151d2a] hover:bg-[#1b2333] text-slate-200 border border-[#232f48] transition-colors"
                      >
                        Review Lead
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVESTIGATION GRAPH PREVIEW / LAUNCH                              */}
      {/* ========================================================================= */}
      {activeTab === 'graph' && (
        <div className="bg-[#0b0e17] border border-[#151d2a] rounded p-8 text-center space-y-4">
          <GitFork className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
              Case Knowledge Graph Explorer
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Launch the full-screen interactive Neo4j graph for {caseData.case_number} to explore entity nodes,
              co-occurrence links, and multi-hop paths.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate(`/cases/${caseId}/graph`)}
              className="inline-flex items-center space-x-2 bg-[#BD3535] hover:bg-[#a32828] text-white px-4 py-2 rounded text-xs font-semibold transition-colors"
            >
              <GitFork className="w-4 h-4" />
              <span>Launch Full Graph Workspace</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {/* Lead Review Modal */}
      {reviewLead && caseId && (
        <LeadReviewModal
          lead={reviewLead}
          caseId={caseId}
          onClose={() => {
            setReviewLead(null);
            refetchLeads();
          }}
        />
      )}

      {/* Evidence Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0e17] border border-[#1b2333] rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#0e131d] border-b border-[#151d2a] text-white px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Upload Case Evidence</span>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#151d2a]">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadEvidenceMutation.mutate();
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wide mb-1 font-mono">
                  Evidence File <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-[#1b2333] bg-[#080b12] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#BD3535]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wide mb-1 font-mono">
                  Acquisition Method
                </label>
                <select
                  value={uploadMethod}
                  onChange={(e) => setUploadMethod(e.target.value)}
                  className="w-full border border-[#1b2333] bg-[#080b12] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#BD3535]"
                >
                  <option value="FIELD_COLLECTION">FIELD_COLLECTION</option>
                  <option value="DIGITAL_FORENSICS">DIGITAL_FORENSICS</option>
                  <option value="CCTV_EXPORT">CCTV_EXPORT</option>
                  <option value="OFFICIAL_REQUEST">OFFICIAL_REQUEST</option>
                  <option value="WITNESS_SUBMISSION">WITNESS_SUBMISSION</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wide mb-1 font-mono">
                  Context / Chain of Custody Notes
                </label>
                <textarea
                  rows={2}
                  value={uploadContext}
                  onChange={(e) => setUploadContext(e.target.value)}
                  placeholder="Recovery location, seizing officer, incident link..."
                  className="w-full border border-[#1b2333] bg-[#080b12] rounded p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#BD3535]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-[#151d2a]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded border border-[#232f48] bg-[#151d2a] text-slate-300 hover:bg-[#1b2333] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadEvidenceMutation.isPending}
                  className="px-4 py-1.5 rounded bg-[#BD3535] hover:bg-[#a32828] text-white font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {uploadEvidenceMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Upload & Ingest</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
