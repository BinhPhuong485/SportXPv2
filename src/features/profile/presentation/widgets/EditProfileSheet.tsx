import React, { useState, useEffect } from 'react';
import { X, User, MapPin } from 'lucide-react';
import { PlayerProfile } from '../../domain/playerProfile';
import { Court } from '../../../rooms/data/managedRoomRepository';

interface EditProfileSheetProps {
  isOpen: boolean;
  profile: PlayerProfile;
  loadCourts: () => Promise<Court[]>;
  onClose: () => void;
  onSave: (displayName: string, homeCourtId: string | null) => Promise<void>;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  isOpen,
  profile,
  loadCourts,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [homeCourtId, setHomeCourtId] = useState<string | null>(profile.homeCourtId || null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName);
      setHomeCourtId(profile.homeCourtId || null);
      setError(null);
      setLoadingCourts(true);
      loadCourts()
        .then((list) => {
          setCourts(list);
          setLoadingCourts(false);
        })
        .catch(() => setLoadingCourts(false));
    }
  }, [isOpen, profile, loadCourts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Tên hiển thị không được để trống.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed, homeCourtId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-[24px] p-5 pb-8 border-t border-app-border shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-app-border mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-app-border/40">
          <span className="text-xs font-bold text-app-muted tracking-widest uppercase">
            CHỈNH SỬA HỒ SƠ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Display Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted">Tên hiển thị</label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="text"
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-app-background border border-app-border text-app-text text-sm focus:outline-hidden focus:border-app-primary transition-colors"
              />
            </div>
          </div>

          {/* Home Court field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-app-muted">
              Sân nhà / Sân quen thuộc (Home Court)
            </label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3.5 text-app-muted pointer-events-none" />
              <select
                value={homeCourtId || ''}
                disabled={loadingCourts}
                onChange={(e) => setHomeCourtId(e.target.value || null)}
                className="w-full h-11 pl-10 pr-8 rounded-xl bg-app-background border border-app-border text-app-text text-sm focus:outline-hidden focus:border-app-primary transition-colors appearance-none"
              >
                <option value="">Chưa chọn sân quen (Tự do)</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.distance_km != null
                      ? `${court.name} (${court.distance_km.toFixed(1)} km)`
                      : court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 mt-2 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs uppercase tracking-wider hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center shadow-xs disabled:opacity-60"
          >
            {saving ? 'ĐANG LƯU…' : 'LƯU THAY ĐỔI'}
          </button>
        </form>
      </div>
    </div>
  );
};

