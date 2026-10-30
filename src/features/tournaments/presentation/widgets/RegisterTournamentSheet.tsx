import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Tournament, getFormatLabel, getRankRequirement } from '../../domain/tournament';
import { Button } from '../../../../shared/components/Button';

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-bento p-6 pb-9 border-t border-app-border shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-app-border mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-black tracking-widest text-app-muted uppercase">
              {isRegistered ? 'CHI TIẾT ĐĂNG KÝ' : 'XÁC NHẬN ĐĂNG KÝ GIẢI'}
            </span>
            <h3 className="text-lg font-black text-app-text mt-0.5 leading-snug">
              {tournament.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detail rows */}
        <div className="flex flex-col gap-3 py-3 border-y border-app-border/60 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Sân đấu</span>
            <span className="font-bold text-app-text text-right max-w-[65%] truncate">
              {tournament.venueName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Thể thức</span>
            <span className="font-bold text-app-text">{getFormatLabel(tournament.format)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Yêu cầu hạng</span>
            <span className="font-bold text-app-text">
              {getRankRequirement(tournament.minTier, tournament.maxTier)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-app-muted">Lệ phí thi đấu</span>
            <span className="font-black text-app-primary text-sm tabular-nums">{feeText}</span>
          </div>
        </div>

        {/* Action area */}
        {isRegistered ? (
          <div className="flex flex-col gap-3 pt-1">
            <div className="p-3.5 rounded-btn bg-app-mint text-app-primary border border-app-primary/30 flex items-center justify-center gap-2 text-xs font-black shadow-xs">
              <CheckCircle2 size={16} />
              <span>BẠN ĐÃ ĐĂNG KÝ THAM GIA GIẢI ĐẤU NÀY</span>
            </div>
            <p className="text-center text-xs text-app-muted italic">
              Để hủy đăng ký sau khi xác nhận, vui lòng liên hệ ban tổ chức giải.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full mt-1"
            >
              Đóng
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 pt-1">
            {/* Warning banner */}
            <div className="p-3.5 rounded-btn bg-app-streak/10 border border-app-streak/30 flex items-start gap-2.5 text-xs text-app-text">
              <AlertTriangle size={16} className="text-app-streak shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-app-streak">Lưu ý:</span> Sau khi gửi đăng ký, bạn không thể tự hủy trên ứng dụng. Nếu cần hủy lượt, vui lòng liên hệ trực tiếp ban tổ chức sân.
              </p>
            </div>

            {/* Mandatory confirmation checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-app-text font-bold px-1 py-1 rounded-lg hover:bg-app-background/50 transition-colors">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="w-4 h-4 rounded border-app-border text-app-primary accent-app-primary cursor-pointer"
              />
              <span>Tôi đã hiểu và cam kết tuân thủ quy định giải đấu</span>
            </label>

            {/* Register submit button */}
            <Button
              variant="primary"
              size="lg"
              disabled={busy || !understood}
              loading={busy}
              onClick={onConfirm}
              className="w-full uppercase tracking-wider text-xs font-black shadow-xs"
            >
              GỬI ĐĂNG KÝ VẬN ĐỘNG VIÊN
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
