import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, QrCode } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const ConnectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [kind, setKind] = useState<'friends' | 'incoming' | 'outgoing' | 'blocked'>('friends');

  const tabs: Record<string, string> = {
    friends: 'Bạn bè',
    incoming: 'Lời mời đến',
    outgoing: 'Đã gửi',
    blocked: 'Đã chặn',
  };

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col">
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>KẾT NỐI CỦA BẠN</span>
        </button>
      </header>

      <PageContent>
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(tabs).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setKind(key as 'friends' | 'incoming' | 'outgoing' | 'blocked')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                kind === key
                  ? 'bg-app-primary text-app-on-primary border-app-primary'
                  : 'bg-app-surface text-app-muted border-app-border hover:border-app-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empty Connection State */}
        <BentoCard className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-app-text">
            Chưa có {tabs[kind].toLowerCase()} nào
          </h3>
          <p className="text-xs text-app-muted max-w-xs leading-relaxed">
            Kết nối với đồng đội bằng cách quét mã QR trên sân đấu hoặc chia sẻ liên kết hồ sơ của bạn.
          </p>

          <button
            onClick={() => navigate('/scan')}
            className="mt-2 px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary font-bold text-xs tracking-wider uppercase flex items-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <QrCode size={15} />
            <span>QUÉT MÃ ĐỐI THỦ</span>
          </button>
        </BentoCard>
      </PageContent>
    </div>
  );
};
