import React from 'react';

export type BadgeVariant = 
  | 'confirmed' 
  | 'active' 
  | 'warning' 
  | 'critical' 
  | 'deferred' 
  | 'closed' 
  | 'person' 
  | 'org' 
  | 'device' 
  | 'phone' 
  | 'financial' 
  | 'vehicle' 
  | 'source' 
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  confirmed: 'bg-[#0b1f14] text-[#4ade80] border-[#166534]',
  active:    'bg-[#0c192c] text-[#60a5fa] border-[#1d4ed8]',
  warning:   'bg-[#261805] text-[#fbbf24] border-[#92400e]',
  critical:  'bg-[#2d0e12] text-[#ff6b6b] border-[#BD3535]',
  deferred:  'bg-[#200f2e] text-[#c084fc] border-[#6b21a8]',
  closed:    'bg-[#111622] text-[#94a3b8] border-[#1e293b]',
  person:    'bg-[#0c192c] text-[#93c5fd] border-[#1e3a8a]',
  org:       'bg-[#261805] text-[#fcd34d] border-[#78350f]',
  device:    'bg-[#200f2e] text-[#d8b4fe] border-[#581c87]',
  phone:     'bg-[#0b1f14] text-[#86efac] border-[#14532d]',
  financial: 'bg-[#291e05] text-[#fef08a] border-[#854d0e]',
  vehicle:   'bg-[#2d0e12] text-[#fca5a5] border-[#991b1b]',
  source:    'bg-[#0e131d] text-[#cbd5e1] border-[#334155]',
  default:   'bg-[#0e131d] text-[#94a3b8] border-[#1e293b]',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
