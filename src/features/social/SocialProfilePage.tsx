import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield } from 'lucide-react';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';

export const SocialProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col">
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border/40">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>HỘ CHIẾU CẦU LÔNG</span>
        </button>
      </header>

      <PageContent>
        <BentoCard>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-app-background border border-app-primary flex items-center justify-center text-lg font-bold">
                <User size={24} className="text-app-primary" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-app-text">Vận động viên</h2>
                <span className="text-xs text-app-muted">Mã hồ sơ: {id}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-app-muted font-bold">CHỈ SỐ ELO</span>
                <div className="text-2xl font-black text-app-primary">850</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-app-primary/10 text-app-primary">
                TB
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-app-muted">
              <Shield size={14} className="text-app-primary" />
              <span>Chỉ bạn bè được xem chỉ số chi tiết của người chơi này.</span>
            </div>

            <button
              onClick={() => alert('Gửi lời mời kết bạn sẽ hoàn thiện trong Phase 5!')}
              className="w-full py-3 rounded-xl bg-app-primary text-app-background font-black text-xs tracking-wider uppercase hover:brightness-105 transition-all mt-2"
            >
              KẾT BẠN
            </button>
          </div>
        </BentoCard>
      </PageContent>
    </div>
  );
};

