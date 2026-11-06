import React from 'react';
import { Shield, Info } from 'lucide-react';

export const RankTierInfoCard: React.FC = () => {
  const tiers = [
    { label: 'Cao thủ phong trào', range: '≥ 1200 Elo', color: 'bg-emerald-500' },
    { label: 'Khá / Tốt', range: '1000 - 1199 Elo', color: 'bg-purple-500' },
    { label: 'Trung bình khá', range: '850 - 999 Elo', color: 'bg-blue-500' },
    { label: 'Trung bình', range: '700 - 849 Elo', color: 'bg-amber-500' },
    { label: 'Nhập môn / Yếu', range: '< 700 Elo', color: 'bg-slate-400' },
  ];

  return (
    <div className="bg-white dark:bg-app-surface rounded-2xl border border-app-border/80 p-5 shadow-2xs select-none">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Hệ thống thang bậc Elo
          </h4>
        </div>
        <Info size={14} className="text-slate-400" />
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
        Elo được tính toán tự động dựa trên kết quả các set đấu có xác thực 2 bên. Đạt tối thiểu 5 trận để chính thức có thứ hạng.
      </p>

      <div className="flex flex-col gap-2">
        {tiers.map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/80 last:border-none"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t.label}
              </span>
            </div>
            <span className="font-bold text-slate-400 dark:text-slate-500 tabular-nums text-[11px]">
              {t.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

