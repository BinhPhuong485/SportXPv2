import React from 'react';
import { AppColors } from '../../../core/theme/tokens';

interface WorkoutWaveGraphicProps {
  height?: number;
  avgHeartRate?: number;
}

export const WorkoutWaveGraphic: React.FC<WorkoutWaveGraphicProps> = ({
  height = 140,
  avgHeartRate = 140,
}) => {
  return (
    <div
      style={{ height }}
      className="relative w-full rounded-[14px] overflow-hidden border border-app-cyan/30"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #08141F 0%, #070B10 50%, #101924 100%)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 340 140">
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AppColors.cyan} stopOpacity="0.25" />
            <stop offset="100%" stopColor={AppColors.cyan} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Fill */}
        <polygon
          points="0,91 34,81 75,59 119,67 163,45 211,73 255,53 299,84 340,70 340,140 0,140"
          fill="url(#waveGradient)"
        />

        {/* Line */}
        <polyline
          points="0,91 34,81 75,59 119,67 163,45 211,73 255,53 299,84 340,70"
          fill="none"
          stroke={AppColors.cyan}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
      </svg>

      {/* Top Left Tag */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 border border-app-cyan/40 text-[10px] font-extrabold tracking-wider text-app-cyan uppercase">
        <span>🏋️</span>
        <span>TẬP THỂ LỰC & BỔ TRỢ</span>
      </div>

      {/* Top Right BPM */}
      <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded-md bg-black/75 border border-app-border text-[10px] font-extrabold text-app-streak uppercase">
        {avgHeartRate} BPM TB
      </div>

      {/* Bottom Subtitle */}
      <div className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-app-muted">
        Zone 3 - Aerobic Power • Footwork 6 góc sân
      </div>
    </div>
  );
};

