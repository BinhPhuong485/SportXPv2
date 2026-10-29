import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Flag } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const RoomSessionPage: React.FC = () => {
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
          <span>BUỔI ĐANG DIỄN RA</span>
        </button>
      </header>

      <PageContent>
        <BentoCard>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-app-primary uppercase">
                PHIÊN THI ĐẤU · SÂN ĐÀO DUY ANH
              </span>
              <span className="text-xs text-app-muted font-bold">Phòng {roomId}</span>
            </div>

            <h2 className="text-xl font-black text-app-text">Điểm danh & Ghi nhận set đấu</h2>

            {/* Attendance checklist */}
            <div className="flex flex-col gap-2 pt-2 border-t border-app-border/40">
              <span className="text-xs font-bold text-app-muted">DANH SÁCH ĐIỂM DANH:</span>
              <div className="flex items-center justify-between py-1.5 border-b border-app-border/20 text-xs">
                <span>Bạn (Host)</span>
                <span className="text-app-primary flex items-center gap-1 font-bold">
                  <CheckCircle size={14} /> Có mặt
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-app-border/20 text-xs">
                <span>Linh Nguyễn</span>
                <span className="text-app-primary flex items-center gap-1 font-bold">
                  <CheckCircle size={14} /> Có mặt
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Kết thúc buổi chơi và mở hộp thoại tổng kết trong Phase 5!');
                navigate(`/rooms/${roomId}`);
              }}
              className="w-full py-3 rounded-xl bg-app-loss text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 transition-all mt-3"
            >
              <Flag size={16} />
              <span>KẾT THÚC BUỔI CHƠI</span>
            </button>
          </div>
        </BentoCard>
      </PageContent>
    </div>
  );
};

