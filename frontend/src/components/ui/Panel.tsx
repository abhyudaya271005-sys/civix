import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-[#0b0e17] border border-[#151d2a] rounded-xs shadow-sm overflow-hidden text-slate-100 ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 bg-[#0e131d] border-b border-[#151d2a] flex items-center justify-between">
          <div>
            {title && <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#64748b] mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};
