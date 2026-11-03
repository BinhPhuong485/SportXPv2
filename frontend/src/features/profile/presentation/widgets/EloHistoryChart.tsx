import React, { useState } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { EloPoint } from '../../domain/profileStats';
import { ProfileSectionCard } from './ProfileSectionCard';

interface EloHistoryChartProps {
  points: EloPoint[];
}

export const EloHistoryChart: React.FC<EloHistoryChartProps> = ({ points }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: EloPoint;
    x: number;
    y: number;
  } | null>(null);

  const hasEnoughData = points && points.length >= 2;

  // Chart Dimensions
  const svgWidth = 500;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 30;

  // Compute Scales
  const eloValues = points.map((p) => p.elo);
  const rawMin = Math.min(...eloValues);
  const rawMax = Math.max(...eloValues);
  const yMin = Math.floor((rawMin - 30) / 25) * 25;
  const yMax = Math.ceil((rawMax + 30) / 25) * 25;
  const yRange = Math.max(50, yMax - yMin);

  const getX = (index: number) => {
    if (points.length <= 1) return (svgWidth - padLeft - padRight) / 2 + padLeft;
    return padLeft + (index / (points.length - 1)) * (svgWidth - padLeft - padRight);
  };

  const getY = (elo: number) => {
    const ratio = (elo - yMin) / yRange;
    return svgHeight - padBottom - ratio * (svgHeight - padTop - padBottom);
  };

  // Build SVG Path
  const coordinates = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.elo),
    point: p,
  }));

  let pathD = '';
  let areaD = '';
  if (coordinates.length > 0) {
    pathD = coordinates.reduce(
      (acc, curr, idx) => (idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
      ''
    );
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const baselineY = svgHeight - padBottom;
    areaD = `${pathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }

  // Reference Horizontal Lines (3 lines)
  const midElo = Math.round((yMin + yMax) / 2);
  const refLines = [yMax, midElo, yMin];

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const netChange = lastPoint && firstPoint ? lastPoint.elo - firstPoint.elo : 0;

  const accessibleSummary = hasEnoughData
    ? `Biểu đồ lịch sử Elo: điểm khởi đầu ${firstPoint.elo}, hiện tại ${lastPoint.elo}, thay đổi ròng ${netChange >= 0 ? '+' : ''}${netChange} Elo qua ${points.length - 1} trận đấu gần đây.`
    : 'Chưa đủ dữ liệu để vẽ đường biểu diễn lịch sử Elo.';

  const netBadge = hasEnoughData ? (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${
        netChange >= 0
          ? 'bg-app-mint text-app-primary border-app-primary/20'
          : 'bg-app-loss/15 text-app-loss border-app-loss/20'
      }`}
    >
      {netChange >= 0 ? `+${netChange} Elo` : `${netChange} Elo`}
    </span>
  ) : null;

  return (
    <ProfileSectionCard
      id="profile-elo-chart-card"
      icon={<TrendingUp size={16} />}
      title="DIỄN BIẾN CHỈ SỐ ELO"
      subtitle="Đường dao động điểm qua từng trận đấu"
      action={netBadge}
    >

      {!hasEnoughData ? (
        /* Graceful State for Fewer Than 2 Points */
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-app-mint/30 border border-app-primary/20 flex items-center justify-center text-app-primary mb-2 shadow-2xs">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-black text-app-text">
            Chưa đủ mốc dữ liệu biểu đồ
          </span>
          <p className="text-[11px] text-app-muted mt-1 max-w-xs leading-relaxed">
            Hệ thống cần tối thiểu 2 trận đấu đã ghi nhận kết quả để vẽ đường biểu diễn lịch sử Elo chi tiết.
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          {/* Accessible Text Description */}
          <span className="sr-only">{accessibleSummary}</span>

          {/* Hand-built SVG Chart */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto drop-shadow-2xs"
            role="img"
            aria-label={accessibleSummary}
          >
            <defs>
              <linearGradient id="eloGradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Reference Grid Lines & Y Axis Labels */}
            {refLines.map((refVal, idx) => {
              const yPos = getY(refVal);
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="currentColor"
                    className="text-app-border/70"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-current text-app-muted text-[10px] font-mono font-bold"
                  >
                    {refVal}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area Under Curve */}
            <path d={areaD} fill="url(#eloGradientArea)" />

            {/* Main Elo Line */}
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              className="text-app-primary"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Points */}
            {coordinates.map((coord, idx) => (
              <g
                key={`point-${idx}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint({ point: coord.point, x: coord.x, y: coord.y })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={5}
                  className="fill-app-surface stroke-app-primary stroke-2 group-hover:r-7 transition-all"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={2.5}
                  className="fill-app-primary"
                />
              </g>
            ))}

            {/* Bottom X-Axis Date Labels (First & Last) */}
            {firstPoint && (
              <text
                x={padLeft}
                y={svgHeight - 8}
                textAnchor="start"
                className="fill-current text-app-muted text-[10px] font-medium"
              >
                {firstPoint.formattedDate}
              </text>
            )}
            {lastPoint && (
              <text
                x={svgWidth - padRight}
                y={svgHeight - 8}
                textAnchor="end"
                className="fill-current text-app-muted text-[10px] font-bold"
              >
                {lastPoint.formattedDate}
              </text>
            )}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-30 px-3 py-2 rounded-xl bg-app-surface text-app-text border border-app-border shadow-xl text-xs -translate-x-1/2 -translate-y-full -top-1 transition-all"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              }}
            >
              <div className="flex items-center gap-1.5 font-black text-app-text">
                <span className="text-app-primary tabular-nums">
                  {hoveredPoint.point.elo} Elo
                </span>
                {hoveredPoint.point.delta !== 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      hoveredPoint.point.delta > 0 ? 'text-app-primary' : 'text-app-loss'
                    }`}
                  >
                    ({hoveredPoint.point.delta > 0 ? `+${hoveredPoint.point.delta}` : hoveredPoint.point.delta})
                  </span>
                )}
              </div>
              <div className="text-[10px] text-app-muted truncate mt-0.5">
                {hoveredPoint.point.courtName} · {hoveredPoint.point.formattedDate}
              </div>
            </div>
          )}
        </div>
      )}
    </ProfileSectionCard>
  );
};
