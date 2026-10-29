import React from 'react';
import { AppColors } from '../../../core/theme/tokens';

interface BadmintonCourtCanvasProps {
  height?: number;
  isPersonal?: boolean;
  wins?: number;
  losses?: number;
  confirmed?: number;
  hasPending?: boolean;
  matchScores?: string[];
}

export const BadmintonCourtCanvas: React.FC<BadmintonCourtCanvasProps> = ({
  height = 140,
  isPersonal = true,
  wins = 0,
  losses = 0,
  confirmed = 0,
  hasPending = false,
  matchScores = [],
}) => {
  return (
    <div
      style={{ height }}
      className="relative w-full rounded-[14px] overflow-hidden border border-app-primary/25 shadow-inner"
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0C1914 0%, #070C10 50%, #09141B 100%)',
        }}
      />

      {/* SVG Court Graphic */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 340 140"
      >
        <g stroke={AppColors.primary} strokeOpacity="0.22" strokeWidth="1" fill="none">
          {/* Outer Boundary */}
          <rect x="16" y="14" width="308" height="112" rx="4" />

          {/* Short Service Lines */}
          <line x1="120" y1="14" x2="120" y2="126" />
          <line x1="220" y1="14" x2="220" y2="126" />

          {/* Center Lines */}
          <line x1="16" y1="70" x2="120" y2="70" />
          <line x1="220" y1="70" x2="324" y2="70" />

          {/* Long Service Lines (Doubles) */}
          <line x1="40" y1="14" x2="40" y2="126" />
          <line x1="300" y1="14" x2="300" y2="126" />
        </g>

        {/* Center Net Line */}
        <line
          x1="170"
          y1="14"
          x2="170"
          y2="126"
          stroke="#FFFFFF"
          strokeOpacity="0.38"
          strokeWidth="1.5"
        />

        {/* Ambient Center Glow */}
        <ellipse cx="170" cy="70" rx="55" ry="24" fill={AppColors.primary} fillOpacity="0.05" />
      </svg>

      {/* Top Left Tag */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 border border-app-primary/30 text-[10px] font-extrabold tracking-wider text-app-primary uppercase">
        <span>🏸</span>
        <span>{isPersonal ? 'CẦU LÔNG ĐÔI' : 'TỔNG KẾT BUỔI CHƠI'}</span>
      </div>

      {/* Top Right Result Badge */}
      <div
        className={`absolute top-2.5 right-3 px-2 py-0.5 rounded-md bg-black/75 border text-[10px] font-extrabold tracking-wide uppercase ${
          hasPending
            ? 'border-app-streak/40 text-app-streak'
            : wins >= losses && wins > 0
            ? 'border-app-primary/40 text-app-primary'
            : 'border-app-border text-app-text'
        }`}
      >
        {hasPending
          ? 'CHỜ XÁC NHẬN'
          : isPersonal
          ? `${wins}W - ${losses}L`
          : `${confirmed} TRẬN CHỐT`}
      </div>

      {/* Bottom Scores Scroll */}
      {matchScores.length > 0 && (
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {matchScores.map((score, idx) => (
            <div
              key={idx}
              className="px-2 py-0.5 rounded bg-black/80 border border-app-border/80 flex items-center gap-1 text-[11px] whitespace-nowrap"
            >
              <span className="text-[10px] font-bold text-app-muted">S{idx + 1}:</span>
              <span className="font-extrabold text-app-text">{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

