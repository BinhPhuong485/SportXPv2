import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tournament, getFormatLabel, getRankRequirement } from '../../domain/tournament';

interface RegisterTournamentSheetProps {
  tournament: Tournament | null;
  isOpen: boolean;
  isRegistered?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export const RegisterTournamentSheet: React.FC<RegisterTournamentSheetProps> = ({
  tournament,
  isOpen,
  isRegistered = false,
  onClose,
  onConfirm,
  busy = false,
}) => {
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUnderstood(false);
    }
  }, [isOpen, tournament?.id]);

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

        {/* Action area */}
        {isRegistered ? (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-app-mint/30 border border-app-primary/20 text-center text-xs font-bold text-app-primary">
              ✓ Bạn đã đăng ký tham gia giải đấu này
            </div>
            <p className="text-center text-xs text-app-muted italic">
              Để huỷ đăng ký, vui lòng liên hệ ban tổ chức.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-[12px] bg-app-surface border border-app-border text-app-text text-xs font-semibold hover:bg-app-background transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            {/* Warning banner */}
            <div className="p-3 rounded-xl bg-app-streak/10 border border-app-streak/30 flex items-start gap-2.5 text-xs text-app-text">
              <AlertTriangle size={16} className="text-app-streak shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-app-streak">Lưu ý:</span> sau khi đăng ký, bạn không thể tự huỷ trong ứng dụng. Muốn huỷ đăng ký, vui lòng liên hệ ban tổ chức.
              </p>
            </div>

            {/* Mandatory confirmation checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-app-text font-medium px-0.5">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="w-4 h-4 rounded border-app-border text-app-primary accent-app-primary cursor-pointer"
              />
              <span>Tôi đã hiểu</span>
            </label>

            {/* Register submit button */}
            <button
              type="button"
              disabled={busy || !understood}
              onClick={onConfirm}
              className="w-full h-12 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs uppercase tracking-wide hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'ĐANG GỬI…' : 'GỬI ĐĂNG KÝ VẬN ĐỘNG VIÊN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
