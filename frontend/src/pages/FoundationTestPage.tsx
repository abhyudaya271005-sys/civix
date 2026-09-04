import React from 'react';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { HierarchyBadge } from '../components/domain/HierarchyBadge';

export const FoundationTestPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Panel
        title="CIVIX 2.0 — Foundation Verification"
        subtitle="Frontend architecture reset to tactical workstation standards"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The frontend has been successfully updated with the dark tactical workstation design system: dark canvas (#07090e), tactical borders (#151d2a), high-density data panels (#0b0e17), and crimson accents (#BD3535).
          </p>

          <div className="border-t border-[#151d2a] pt-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Visual Hierarchy Standard Verification
            </h4>
            <div className="flex flex-wrap gap-2 items-center">
              <HierarchyBadge tier="SOURCE_EVIDENCE" />
              <span className="text-xs text-slate-600">➔</span>
              <HierarchyBadge tier="DETERMINISTIC_FINDING" />
              <span className="text-xs text-slate-600">➔</span>
              <HierarchyBadge tier="MODEL_SIGNAL" />
              <span className="text-xs text-slate-600">➔</span>
              <HierarchyBadge tier="AI_EXPLANATION" />
            </div>
          </div>

          <div className="border-t border-[#151d2a] pt-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Institutional Status & Entity Type Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="confirmed">Confirmed</Badge>
              <Badge variant="active">Active</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="critical">Critical</Badge>
              <Badge variant="deferred">Deferred</Badge>
              <Badge variant="closed">Closed</Badge>
              <Badge variant="person">Person</Badge>
              <Badge variant="org">Organization</Badge>
              <Badge variant="device">Device</Badge>
              <Badge variant="phone">Phone</Badge>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};
