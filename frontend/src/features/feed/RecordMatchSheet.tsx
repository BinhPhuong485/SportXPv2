import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { MatchDraft } from './domain/activity';

interface RecordMatchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: MatchDraft) => Promise<void>;
}

export const RecordMatchSheet: React.FC<RecordMatchSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [court, setCourt] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [score, setScore] = useState('');
  const [isWin, setIsWin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!court.trim()) errors.court = 'Vui lòng nhập tên sân.';
    if (!teamA.trim()) errors.teamA = 'Vui lòng nhập tên đội a (đội của bạn).';
    if (!teamB.trim()) errors.teamB = 'Vui lòng nhập tên đội b.';

    const scoreErr = MatchDraft.validateScore(score);
    if (scoreErr) errors.score = scoreErr;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!validate()) return;

    setBusy(true);
    setError(null);

    try {
      await onSubmit({
        courtName: court.trim(),
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        score: score.trim().replace(/–/g, '-'),
        isWin,
      });
      onClose();
    } catch {
      setError(
        'Chưa xác nhận được kết quả. Kiểm tra bảng tin trước khi gửi lại để tránh ghi trùng.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-app-surface border border-app-border rounded-t-[24px] sm:rounded-[24px] p-6 pb-8 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-app-text tracking-tight">Ghi nhận set cầu</h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Tên sân */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Tên sân
            </label>
            <input
              type="text"
              maxLength={120}
              disabled={busy}
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              placeholder="Ví dụ: Sân số 0 Đào Duy Anh"
              className="w-full h-12 px-3.5 rounded-xl bg-app-background border border-app-border text-sm text-app-text placeholder:text-app-muted/60 focus:outline-none focus:border-app-primary transition-colors disabled:opacity-50"
            />
            {fieldErrors.court && (
              <span className="text-xs text-app-loss">{fieldErrors.court}</span>
            )}
          </div>

          {/* Tên đội A */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Tên đội A (đội của bạn)
            </label>
            <input
              type="text"
              maxLength={120}
              disabled={busy}
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              placeholder="Ví dụ: Bạn & Linh"
              className="w-full h-12 px-3.5 rounded-xl bg-app-background border border-app-border text-sm text-app-text placeholder:text-app-muted/60 focus:outline-none focus:border-app-primary transition-colors disabled:opacity-50"
            />
            {fieldErrors.teamA && (
              <span className="text-xs text-app-loss">{fieldErrors.teamA}</span>
            )}
          </div>

          {/* Tên đội B */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Tên đội B
            </label>
            <input
              type="text"
              maxLength={120}
              disabled={busy}
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              placeholder="Ví dụ: Minh & Bảo"
              className="w-full h-12 px-3.5 rounded-xl bg-app-background border border-app-border text-sm text-app-text placeholder:text-app-muted/60 focus:outline-none focus:border-app-primary transition-colors disabled:opacity-50"
            />
            {fieldErrors.teamB && (
              <span className="text-xs text-app-loss">{fieldErrors.teamB}</span>
            )}
          </div>

          {/* Tỉ số */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Tỉ số
            </label>
            <input
              type="text"
              disabled={busy}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="21-19 21-16"
              className="w-full h-12 px-3.5 rounded-xl bg-app-background border border-app-border text-sm text-app-text placeholder:text-app-muted/60 focus:outline-none focus:border-app-primary transition-colors disabled:opacity-50 font-mono"
            />
            {fieldErrors.score ? (
              <span className="text-xs text-app-loss">{fieldErrors.score}</span>
            ) : (
              <span className="text-[11px] text-app-muted">Nhập 1–3 set, ví dụ: 21-19 21-16.</span>
            )}
          </div>

          {/* Kết quả của đội A */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider">
              Kết quả của đội A (đội của bạn)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setIsWin(true)}
                className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  isWin
                    ? 'bg-app-primary/15 border-app-primary text-app-primary'
                    : 'bg-app-background border-app-border text-app-muted hover:text-app-text'
                }`}
              >
                <Check size={16} />
                <span>Thắng</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setIsWin(false)}
                className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  !isWin
                    ? 'bg-app-loss/15 border-app-loss text-app-loss'
                    : 'bg-app-background border-app-border text-app-muted hover:text-app-text'
                }`}
              >
                <X size={16} />
                <span>Thua</span>
              </button>
            </div>
          </div>

          {/* Submission Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 mt-2 rounded-xl bg-app-primary text-app-on-primary font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {busy ? 'ĐANG GHI NHẬN…' : 'LƯU KẾT QUẢ'}
          </button>
        </form>
      </div>
    </div>
  );
};

