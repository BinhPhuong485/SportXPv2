import React from 'react';
import { AppColors } from '../../../core/theme/tokens';

interface RunningRouteGraphicProps {
  height?: number;
  distanceKm?: number;
  pace?: string;
}

export const RunningRouteGraphic: React.FC<RunningRouteGraphicProps> = ({
  height = 140,
  distanceKm = 5.2,
  pace = '5:26',
}) => {
  return (
    <div
      style={{ height }}
      className="relative w-full rounded-[14px] overflow-hidden border border-[#FC5200]/30"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #140D09 0%, #090A0C 50%, #0A0F14 100%)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 340 140">
        {/* Subtle coordinate grid lines */}
        <g stroke="#FFFFFF" strokeOpacity="0.04" strokeWidth="0.8">
          {[20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320].map((x) => (
            <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="140" />
          ))}
          {[25, 50, 75, 100, 125].map((y) => (
            <line key={`y-${y}`} x1="0" y1={y} x2="340" y2={y} />
          ))}
        </g>

        {/* Glow Path */}
        <path
          d="M 40 100 C 68 49, 119 35, 170 56 C 221 77, 272 39, 299 84 Q 278 114, 231 109 L 153 105"
          fill="none"
          stroke={AppColors.strava}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.25"
        />

        {/* Crisp GPS Path */}
        <path
          d="M 40 100 C 68 49, 119 35, 170 56 C 221 77, 272 39, 299 84 Q 278 114, 231 109 L 153 105"
          fill="none"
          stroke={AppColors.strava}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start Point (Green dot) */}
        <circle cx="40" cy="100" r="5" fill={AppColors.primary} />
        <circle cx="40" cy="100" r="2" fill="#FFFFFF" />

        {/* End Point (Orange dot) */}
        <circle cx="153" cy="105" r="5" fill={AppColors.strava} />
        <circle cx="153" cy="105" r="2" fill="#FFFFFF" />
      </svg>

      {/* Top Left Tag */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 border border-[#FC5200]/40 text-[10px] font-extrabold tracking-wider text-[#FC5200] uppercase">
        <span>🏃</span>
        <span>CHẠY BỘ NGOÀI TRỜI</span>
      </div>

      {/* Top Right Tag */}
      <div className="absolute top-2.5 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 border border-app-border text-[9px] font-extrabold tracking-wide text-app-muted uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-app-primary animate-pulse" />
        <span>GPS TRACKED</span>
      </div>

      {/* Bottom Right Watermark */}
      <div className="absolute bottom-2.5 right-3 px-2 py-1 rounded-md bg-black/80 border border-app-border text-[11px] font-extrabold text-app-text tracking-wide">
        {distanceKm.toFixed(2)} km • {pace} /km
      </div>
    </div>
  );
};

