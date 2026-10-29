import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const RoomEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId?: string }>();
  const isEditing = !!roomId;

  const [title, setTitle] = useState(isEditing ? 'Kèo giao lưu cuối tuần' : 'Kèo giao lưu');
  const [duration, setDuration] = useState('120');
  const [capacity, setCapacity] = useState('4');
  const [minElo, setMinElo] = useState('0');
  const [maxElo, setMaxElo] = useState('2000');
  const [fee, setFee] = useState('40000');
  const [courtLabel, setCourtLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [roomCode] = useState('#XP-8888');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tạo/Sửa phòng chi tiết với Supabase RPC sẽ hoàn thiện trong Phase 5!');
    navigate('/rooms');
  };

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col">
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border/40">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{isEditing ? 'CHỈNH SỬA KÈO ĐẤU' : 'TẠO KÈO MỚI'}</span>
        </button>
      </header>

      <PageContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BentoCard>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-app-muted">
                <span className="font-bold">MÃ PHÒNG: {roomCode}</span>
                <button
                  type="button"
                  onClick={() => alert(`Đã sao chép mã phòng ${roomCode}`)}
                  className="flex items-center gap-1 text-app-primary hover:underline font-semibold"
                >
                  <Copy size={13} />
                  <span>Sao chép</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Tên buổi chơi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Số chỗ chơi</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Elo tối thiểu</label>
                  <input
                    type="number"
                    value={minElo}
                    onChange={(e) => setMinElo(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Elo tối đa</label>
                  <input
                    type="number"
                    value={maxElo}
                    onChange={(e) => setMaxElo(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Phí dự kiến/người (VND)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Sân con / số sân</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sân 3"
                  value={courtLabel}
                  onChange={(e) => setCourtLabel(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Ghi chú / phí đã gồm</label>
                <textarea
                  rows={2}
                  placeholder="Tiền sân, nước, cầu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2 text-sm text-app-text outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-app-primary text-app-background font-black text-xs tracking-wider uppercase hover:brightness-105 transition-all mt-2"
              >
                {isEditing ? 'LƯU THAY ĐỔI' : 'TẠO KÈO ĐẤU'}
              </button>
            </div>
          </BentoCard>
        </form>
      </PageContent>
    </div>
  );
};

