import React from 'react';
import { Sparkles } from 'lucide-react';
import { ProfileSectionCard } from './ProfileSectionCard';

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

  const summaryAction = form.length > 0 ? (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-app-mint text-app-primary border border-app-primary/20">
      {wins} Thắng - {losses} Bại
    </span>
  ) : null;

  return (
    <ProfileSectionCard
      id="profile-recent-form-card"
      icon={<Sparkles size={16} />}
      title="PHONG ĐỘ GẦN ĐÂY"
      subtitle="10 trận đấu gần nhất (Cũ → Mới nhất)"
      action={summaryAction}
    >
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

          {/* Filled Result Dots */}
          {chronological.map((result, idx) => {
            const isLatest = idx === chronological.length - 1;
            const isWin = result === 'W';

            return (
              <div
                key={`form-${idx}`}
                className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs transition-transform select-none ${
                  isWin
                    ? 'bg-app-primary text-app-on-primary shadow-xs'
                    : 'bg-app-loss text-white shadow-xs'
                } ${isLatest ? 'ring-2 ring-offset-2 ring-offset-app-surface ring-app-primary scale-110' : ''}`}
                title={isLatest ? `Trận mới nhất: ${isWin ? 'Thắng' : 'Thua'}` : isWin ? 'Thắng' : 'Thua'}
              >
                <span>{result}</span>
              </div>
            );
          })}
        </div>
      )}
    </ProfileSectionCard>
  );
};
