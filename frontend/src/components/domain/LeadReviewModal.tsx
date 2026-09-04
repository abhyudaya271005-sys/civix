import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../../api/leads';
import type { InvestigativeLeadResponse } from '../../types/api';
import { HierarchyBadge } from './HierarchyBadge';
import { X, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface LeadReviewModalProps {
  lead: InvestigativeLeadResponse;
  caseId: string;
  onClose: () => void;
}

export const LeadReviewModal: React.FC<LeadReviewModalProps> = ({ lead, caseId, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('CONFIRMED');
  const [notes, setNotes] = useState<string>('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      leadsApi.disposeLead(caseId, lead.lead_id, {
        status: selectedStatus,
        disposition_notes: notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', caseId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0b0e17] border border-[#1b2333] rounded-lg shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#0e131d] border-b border-[#151d2a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HierarchyBadge tier="MODEL_SIGNAL" />
            <h3 className="text-sm font-bold tracking-tight uppercase font-mono">Investigator Lead Review</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#151d2a] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-[#080b12] p-3.5 border border-[#151d2a] rounded">
            <h4 className="text-xs font-bold text-slate-100 font-sans mb-1">{lead.lead_text}</h4>
            <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
              <span>Behavioral Model Score: {lead.ai_confidence ? lead.ai_confidence.toFixed(3) : 'N/A'}</span>
              <span className="text-[#1b2333]">•</span>
              <span>Priority: {lead.priority}</span>
              <span className="text-[#1b2333]">•</span>
              <span>Status: {lead.status}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Select Disposition Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('CONFIRMED')}
                className={`py-2 px-3 border rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  selectedStatus === 'CONFIRMED'
                    ? 'bg-[#0b1f14] border-emerald-500/50 text-emerald-400 font-bold'
                    : 'bg-[#0e131d] border-[#1b2333] text-slate-400 hover:bg-[#151d2a] hover:text-slate-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Confirm Lead</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('FALSE_POSITIVE')}
                className={`py-2 px-3 border rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  selectedStatus === 'FALSE_POSITIVE'
                    ? 'bg-[#2d0e12] border-[#BD3535] text-red-400 font-bold'
                    : 'bg-[#0e131d] border-[#1b2333] text-slate-400 hover:bg-[#151d2a] hover:text-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span>False Positive</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('CLOSED')}
                className={`py-2 px-3 border rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  selectedStatus === 'CLOSED'
                    ? 'bg-[#151d2a] border-slate-500 text-slate-200 font-bold'
                    : 'bg-[#0e131d] border-[#1b2333] text-slate-400 hover:bg-[#151d2a] hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Close Lead</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Investigator Rationale / Disposition Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record investigative basis for this disposition action..."
              className="w-full text-xs bg-[#080b12] border border-[#1b2333] rounded p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#BD3535]"
            />
          </div>

          {mutation.isError && (
            <div className="p-2.5 bg-[#2d0e12] border border-[#BD3535]/50 rounded text-xs text-red-300 font-mono">
              Failed to submit disposition action. State machine violation or permission error.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0e131d] border-t border-[#151d2a] px-6 py-3 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#151d2a] hover:bg-[#1b2333] border border-[#232f48] rounded text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !notes.trim()}
            className="px-4 py-2 bg-[#BD3535] hover:bg-[#a32828] text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Disposition</span>
          </button>
        </div>
      </div>
    </div>
  );
};
