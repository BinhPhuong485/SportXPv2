import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Play } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col">
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border/40">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>CHI TIẾT KÈO ĐẤU</span>
        </button>
      </header>

      <PageContent>
        <BentoCard>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-app-primary uppercase">
                #XP-8888 · ĐANG TUYỂN
              </span>
              <span className="text-xs font-bold text-app-muted">Phòng: {roomId}</span>
            </div>

            <h2 className="text-xl font-black text-app-text">Kèo giao lưu cuối tuần</h2>

            <div className="flex flex-col gap-2 text-xs text-app-muted">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-app-primary" />
                <span className="text-app-text font-semibold">Sân Đào Duy Anh (Sân 3)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>18:00 - 20:00 • Hôm nay</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>Còn 2/4 chỗ trống • Trình độ: 600 - 1200 Elo</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} />
                <span>45.000 đ/người (Đã gồm cầu)</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => navigate(`/rooms/${roomId}/session`)}
                className="w-full py-3 rounded-xl bg-app-primary text-app-background font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 transition-all"
              >
                <Play size={16} fill="currentColor" />
                <span>VÀO BUỔI CHƠI (SESSION)</span>
              </button>
            </div>
          </div>
        </BentoCard>
      </PageContent>
    </div>
  );
};

