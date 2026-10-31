import React from 'react';
import { BentoCard } from '../../../../shared/components/BentoCard';

interface RecentFormDotsProps {
  form: ('W' | 'L')[]; // Newest first
}

export const RecentFormDots: React.FC<RecentFormDotsProps> = ({ form }) => {
  // We want to show up to 10 slots.
  // Chronological order: Oldest -> Newest
  const chronological = [...form].slice(0, 10).reverse();
  const totalSlots = 10;
  const emptyCount = Math.max(0, totalSlots - chronological.length);

  const wins = form.filter((f) => f === 'W').length;
  const losses = form.filter((f) => f === 'L').length;

  return (
    <BentoCard doubleBezel className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1 border-b border-app-border/40">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
            Phong độ gần đây
          </h3>
          <p className="text-[11px] text-app-muted">
            10 trận đấu gần nhất (Cũ → Mới nhất)
          </p>
        </div>

        {form.length > 0 && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-app-mint text-app-primary border border-app-primary/20">
            {wins} Thắng - {losses} Bại
          </span>
        )}
      </div>

      {form.length === 0 ? (
        <div className="py-4 text-center text-xs text-app-muted">
          Chưa có dữ liệu phong độ trận đấu.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1.5 py-1 px-1">
          {/* Empty slots on the left if fewer than 10 matches */}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-app-border flex items-center justify-center text-[10px] text-app-muted/40 font-bold select-none"
              title="Chưa đấu"
            >
              —
            </div>
          ))}

          {/* Chronological dots */}
          {chronological.map((result, idx) => {
            const isLatest = idx === chronological.length - 1;
            const isWin = result === 'W';
            return (
              <div
                key={`form-${idx}`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black select-none shadow-xs transition-transform hover:scale-110 ${
                  isLatest ? 'ring-2 ring-app-primary ring-offset-2 ring-offset-app-surface' : ''
                } ${
                  isWin
                    ? 'bg-app-primary text-app-on-primary'
                    : 'bg-app-loss text-white'
                }`}
                title={isWin ? 'Thắng (Win)' : 'Bại (Loss)'}
              >
                {isWin ? 'T' : 'B'}
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
};
