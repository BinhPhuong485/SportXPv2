import React from 'react';
import { Tournament, getFormatLabel, getRankRequirement } from '../../domain/tournament';

interface RegisterTournamentSheetProps {
  tournament: Tournament | null;
  isOpen: boolean;
  isRegistered?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onWithdraw?: () => void;
  busy?: boolean;
}

export const RegisterTournamentSheet: React.FC<RegisterTournamentSheetProps> = ({
  tournament,
  isOpen,
  isRegistered = false,
  onClose,
  onConfirm,
  onWithdraw,
  busy = false,
}) => {
  if (!isOpen || !tournament) return null;

  const feeText = tournament.entryFee === 0 ? 'Miễn phí' : `${tournament.entryFee.toLocaleString('vi-VN')} VNĐ`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-[20px] p-5 pb-9 border-t border-app-border shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full bg-app-border mx-auto -mt-1 mb-2" />

        {/* Title & subtitle */}
        <div>
          <h3 className="text-lg font-bold text-app-text">
            {isRegistered ? 'Thông tin đăng ký giải' : 'Xác nhận đăng ký giải'}
          </h3>
          <p className="text-sm text-app-muted mt-1 leading-snug">{tournament.title}</p>
        </div>

        {/* Detail rows */}
        <div className="flex flex-col gap-2.5 py-2 border-y border-app-border/40 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Sân đấu</span>
            <span className="font-semibold text-app-text text-right max-w-[65%] truncate">
              {tournament.venueName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Thể thức</span>
            <span className="font-semibold text-app-text">{getFormatLabel(tournament.format)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Yêu cầu rank</span>
            <span className="font-semibold text-app-text">
              {getRankRequirement(tournament.minTier, tournament.maxTier)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Lệ phí</span>
            <span className="font-semibold text-app-text">{feeText}</span>
          </div>
        </div>

        {/* Action button */}
        {isRegistered ? (
          <div className="flex flex-col gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-app-mint/30 border border-app-primary/20 text-center text-xs font-bold text-app-primary">
              ✓ Bạn đã đăng ký tham gia giải đấu này
            </div>
            {onWithdraw && (
              <button
                type="button"
                disabled={busy}
                onClick={onWithdraw}
                className="w-full h-12 rounded-[12px] border border-app-loss text-app-loss text-xs font-bold hover:bg-app-loss/10 transition-colors flex items-center justify-center"
              >
                {busy ? 'ĐANG XỬ LÝ…' : 'HỦY ĐĂNG KÝ (RÚT LUI KHỎI GIẢI)'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-[12px] bg-app-surface border border-app-border text-app-text text-xs font-semibold hover:bg-app-background transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="w-full h-12 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs uppercase tracking-wide hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center shadow-xs"
            >
              {busy ? 'ĐANG GỬI…' : 'GỬI ĐĂNG KÝ VẬN ĐỘNG VIÊN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

