import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
  doubleBezel?: boolean;
  courtPattern?: boolean;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  highlighted = false,
  doubleBezel = false,
  courtPattern = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative w-full border border-app-border rounded-bento text-app-text overflow-hidden transition-all duration-200 ${
        highlighted ? 'bg-bento-highlight' : 'bg-app-surface'
      } ${
        doubleBezel ? 'p-1.5 shadow-sm' : 'p-5 shadow-2xs'
      } ${
        onClick ? 'cursor-pointer hover:border-app-primary/50 hover:shadow-xs active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Subtle badminton court tramline watermark */}
      {courtPattern && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06] bg-no-repeat bg-center bg-cover"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='200' viewBox='0 0 120 200'%3E%3Crect x='10' y='10' width='100' height='180' fill='none' stroke='currentColor' stroke-width='2'/%3E%3Cline x1='10' y1='100' x2='110' y2='100' stroke='currentColor' stroke-width='3'/%3E%3Cline x1='60' y1='10' x2='60' y2='100' stroke='currentColor' stroke-width='1.5'/%3E%3Cline x1='60' y1='100' x2='60' y2='190' stroke='currentColor' stroke-width='1.5'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {doubleBezel ? (
        <div className="w-full h-full rounded-[16px] border border-app-border/70 bg-app-surface/60 p-4 relative z-10 backdrop-blur-xs">
          {children}
        </div>
      ) : (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
};
