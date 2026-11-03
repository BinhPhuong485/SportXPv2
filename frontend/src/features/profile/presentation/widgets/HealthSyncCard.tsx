import React from 'react';
import { Heart } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';

export const HealthSyncCard: React.FC = () => {
  return (
    <BentoCard doubleBezel>
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-app-loss/15 border border-app-loss/25 flex items-center justify-center text-app-loss shrink-0">
          <Heart size={20} className="fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-app-text leading-tight truncate">
            Apple Health & Health Connect
          </h4>
          <p className="text-xs text-app-muted mt-0.5 truncate font-medium">
            Sẵn sàng kết nối nhịp tim và tiêu hao calo khi ra sân
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-badge bg-app-background border border-app-border text-[9px] font-black text-app-muted uppercase tracking-wider shrink-0">
          GIAI ĐOẠN 2
        </span>
      </div>
    </BentoCard>
  );
};
