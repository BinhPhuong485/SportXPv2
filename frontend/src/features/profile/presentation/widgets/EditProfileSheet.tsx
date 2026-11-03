import React, { useState, useEffect } from 'react';
import { X, User, MapPin } from 'lucide-react';
import { PlayerProfile } from '../../domain/playerProfile';
import { Court } from '../../../rooms/data/managedRoomRepository';
import { Button } from '../../../../shared/components/Button';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        <div className="flex items-center justify-between pb-2 border-b border-app-border/40">
          <div>
            <span className="text-[11px] font-black text-app-muted tracking-widest uppercase">
              THIẾT LẬP THÔNG TIN
            </span>
            <h3 className="text-base font-black text-app-text mt-0.5">
              Chỉnh sửa hồ sơ cá nhân
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-btn bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Display Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Tên hiển thị</label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="text"
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Home Court field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">
              Sân nhà / Sân quen thuộc (Home Court)
            </label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3.5 text-app-muted pointer-events-none" />
              <select
                value={homeCourtId || ''}
                disabled={loadingCourts}
                onChange={(e) => setHomeCourtId(e.target.value || null)}
                className="w-full h-12 pl-10 pr-8 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all appearance-none cursor-pointer"
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving}
            loading={saving}
            className="w-full uppercase tracking-wider text-xs font-black mt-2 shadow-xs"
          >
            LƯU THAY ĐỔI
          </Button>
        </form>
      </div>
    </div>
  );
};
