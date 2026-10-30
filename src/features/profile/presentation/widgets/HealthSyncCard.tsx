import React from 'react';
import { Heart } from 'lucide-react';
import { BentoCard } from '../../../../shared/components/BentoCard';

export const HealthSyncCard: React.FC = () => {
  return (
    <BentoCard>
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center text-red-500 shrink-0">
          <Heart size={20} className="fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-app-text leading-tight truncate">
            Apple Health / Health Connect
          </h4>
          <p className="text-[11px] text-app-muted mt-0.5 truncate">
            Sẵn sàng đồng bộ nhịp tim và calo khi ra sân
          </p>
        </div>
        <span className="px-2 py-1 rounded-lg bg-app-border text-[9px] font-bold text-app-muted uppercase tracking-wider shrink-0">
          GIAI ĐOẠN 2
        </span>
      </div>
    </BentoCard>
  );
};

