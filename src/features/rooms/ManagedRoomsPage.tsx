import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, RotateCw, SlidersHorizontal, Activity } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { ModalSheet } from '../../shared/components/ModalSheet';

export const ManagedRoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'mine'>('discover');
  const [mineSubTab, setMineSubTab] = useState<'mine' | 'history'>('mine');
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <div className="w-full flex flex-col">
      {/* 1. TOP BAR: KÈO ĐẤU + KHU VỰC + NHẬP MÃ + TẢI LẠI */}
      <div className="w-full max-w-content mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex flex-col cursor-pointer select-none">
          <h1 className="text-2xl font-extrabold text-app-text tracking-tight leading-tight">
            Kèo đấu
          </h1>
          <span className="text-xs text-app-muted flex items-center gap-1 font-medium mt-0.5">
            TP. Hồ Chí Minh ▾
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJoinCodeOpen(true)}
            className="h-9 px-3 rounded-xl border border-app-border bg-app-surface text-app-text text-xs font-bold flex items-center gap-1.5 hover:border-app-primary/50 transition-colors shadow-2xs"
          >
            <Hash size={15} className="text-app-primary" />
            <span>Nhập mã</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Tải lại"
            className="w-9 h-9 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text flex items-center justify-center transition-colors shadow-2xs"
          >
            <RotateCw size={17} />
          </button>
        </div>
      </div>

      <PageContent>
        {/* 2. SCOPE TABS: TÌM KÈO / BUỔI CỦA TÔI */}
        <div className="p-1 bg-app-surface rounded-[14px] border border-app-border flex">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
              activeTab === 'discover'
                ? 'bg-app-primary text-app-background shadow-xs'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            Tìm kèo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
              activeTab === 'mine'
                ? 'bg-app-primary text-app-background shadow-xs'
                : 'text-app-muted hover:text-app-text'
            }`}
          >
            Buổi của tôi
          </button>
        </div>

        {/* Sub-tabs for "Buổi của tôi" */}
        {activeTab === 'mine' && (
          <div className="flex gap-2">
            <button
              onClick={() => setMineSubTab('mine')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                mineSubTab === 'mine'
                  ? 'bg-app-primary/10 border-app-primary text-app-primary'
                  : 'bg-app-surface border-app-border text-app-muted'
              }`}
            >
              Sắp tới
            </button>
            <button
              onClick={() => setMineSubTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                mineSubTab === 'history'
                  ? 'bg-app-primary/10 border-app-primary text-app-primary'
                  : 'bg-app-surface border-app-border text-app-muted'
              }`}
            >
              Lịch sử
            </button>
          </div>
        )}

        {/* 3. FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            className="p-2 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text shrink-0"
            title="Bộ lọc nâng cao"
          >
            <SlidersHorizontal size={15} />
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-app-primary text-app-background'
                : 'bg-app-surface border border-app-border text-app-muted'
            }`}
          >
            Tất cả
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('area')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedFilter === 'area'
                ? 'bg-app-primary text-app-background'
                : 'bg-app-surface border border-app-border text-app-muted'
            }`}
          >
            Khu vực ▾
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('skill')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedFilter === 'skill'
                ? 'bg-app-primary text-app-background'
                : 'bg-app-surface border border-app-border text-app-muted'
            }`}
          >
            Trình độ ▾
          </button>
        </div>

        {/* 4. CONTENT / EMPTY STATE MATCHING FLUTTER */}
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-app-mint flex items-center justify-center text-app-primary mb-3">
            <Activity size={32} />
          </div>
          <h3 className="text-base font-bold text-app-text mb-1">
            Chưa có kèo nào quanh đây
          </h3>
          <p className="text-xs text-app-muted max-w-[300px] leading-relaxed mb-6">
            Thử mở rộng bán kính tìm kiếm hoặc tạo buổi chơi mới để mời bạn bè cùng tham gia.
          </p>

          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="px-5 py-2.5 rounded-xl border border-app-primary text-app-primary text-xs font-bold hover:bg-app-mint/30 active:scale-95 transition-all"
          >
            TẠO KÈO ĐẦU TIÊN
          </button>
        </div>
      </PageContent>

      {/* JOIN BY CODE MODAL SHEET */}
      <ModalSheet
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
        title="VÀO PHÒNG BẰNG MÃ"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-app-muted leading-relaxed">
            Nhập mã phòng do host chia sẻ (ví dụ: #XP-8291) để tìm và tham gia kèo đấu. Phòng đã tham gia sẽ tự động nằm trong "Buổi của tôi".
          </p>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-app-primary pointer-events-none">
              <Hash size={20} />
            </span>
            <input
              type="text"
              autoFocus
              placeholder="VD: #XP-8291 hoặc 8291"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full h-12 bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-11 pr-4 text-base font-bold tracking-wider text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!joinCode.trim()) return;
              setIsJoinCodeOpen(false);
              navigate(`/rooms/${joinCode.trim().toLowerCase()}`);
            }}
            className="w-full h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-sm tracking-wide hover:brightness-105 active:scale-[0.99] transition-all shadow-xs"
          >
            TÌM VÀ VÀO PHÒNG
          </button>
        </div>
      </ModalSheet>
    </div>
  );
};
