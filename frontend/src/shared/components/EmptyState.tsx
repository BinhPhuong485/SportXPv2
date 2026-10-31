import React from 'react';

export type IllustrationType = 'shuttlecock' | 'trophy' | 'calendar' | 'racket';

interface EmptyStateProps {
  type?: IllustrationType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'shuttlecock',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-[20px] bg-app-surface border border-app-border shadow-xs ${className}`}
    >
      <div className="w-20 h-20 mb-4 rounded-2xl bg-app-mint/40 border border-app-primary/20 flex items-center justify-center text-app-primary">
        {type === 'shuttlecock' && (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none stroke-[2.2]">
            {/* Badminton Shuttlecock SVG */}
            <path d="M24 38c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" className="fill-current/20" />
            <path d="M19 28 L12 10 M29 28 L36 10" strokeLinecap="round" />
            <path d="M22 26 L19 10 M26 26 L29 10" strokeLinecap="round" />
            <path d="M12 10 Q24 6 36 10" strokeLinecap="round" />
            <path d="M14 16 Q24 13 34 16" strokeLinecap="round" />
            <path d="M16 22 Q24 19 32 22" strokeLinecap="round" />
          </svg>
        )}
        {type === 'trophy' && (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none stroke-[2.2]">
            {/* Trophy SVG */}
            <path d="M14 10 h20 v12 a10 10 0 0 1 -20 0 Z" className="fill-current/20" />
            <path d="M14 14 H8 a4 4 0 0 0 0 8 h6 M34 14 h6 a4 4 0 0 1 0 8 h-6" strokeLinecap="round" />
            <path d="M24 32 v6 M18 38 h12" strokeLinecap="round" />
          </svg>
        )}
        {type === 'calendar' && (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none stroke-[2.2]">
            {/* Calendar SVG */}
            <rect x="8" y="12" width="32" height="28" rx="4" className="fill-current/15" />
            <path d="M8 20 h32 M16 8 v8 M32 8 v8" strokeLinecap="round" />
            <circle cx="20" cy="28" r="2" fill="currentColor" />
            <circle cx="28" cy="28" r="2" fill="currentColor" />
            <circle cx="24" cy="34" r="2" fill="currentColor" />
          </svg>
        )}
        {type === 'racket' && (
          <svg viewBox="0 0 48 48" className="w-12 h-12 stroke-current fill-none stroke-[2.2]">
            {/* Racket SVG */}
            <ellipse cx="20" cy="18" rx="10" ry="12" className="fill-current/15" />
            <path d="M20 6 v24 M10 18 h20 M27 27 L38 38 M35 35 L42 42" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-extrabold text-app-text tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-app-muted max-w-xs leading-relaxed mb-5">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-touch px-5 py-2.5 rounded-btn bg-app-primary text-app-on-primary text-xs font-bold uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

