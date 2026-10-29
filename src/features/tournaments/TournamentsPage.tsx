import React from 'react';
import { Trophy } from 'lucide-react';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';

export const TournamentsPage: React.FC = () => {
  return (
    <PageContent>
      <BentoCard>
        <div className="flex flex-col items-start gap-4">
          <Trophy size={32} className="text-app-primary" />
          <h2 className="text-lg font-bold text-app-text">Giải đấu phong trào</h2>
          <p className="text-sm text-app-muted leading-relaxed">
            Sắp ra mắt. Tạo giải, theo dõi bảng đấu và ghi nhận thành tích tại đây.
          </p>
        </div>
      </BentoCard>
    </PageContent>
  );
};

