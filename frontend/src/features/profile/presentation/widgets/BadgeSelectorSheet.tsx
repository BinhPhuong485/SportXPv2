import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Check,
  Zap,
  Shield,
  Flame,
  Sparkles,
  Award,
  Crown,
  Trophy,
  Info,
} from 'lucide-react';
import { ClientAchievement } from '../../domain/profileStats';
import { Button } from '../../../../shared/components/Button';

interface BadgeSelectorSheetProps {
  isOpen: boolean;
  achievements: ClientAchievement[];
  equippedBadgeIds: string[];
  onClose: () => void;
  onSave: (badgeIds: string[]) => void;
}

export function renderBadgeIcon(iconName: string, size: number = 16, className: string = '') {
  switch (iconName) {
    case 'zap':
      return <Zap size={size} className={className} />;
    case 'shield':
      return <Shield size={size} className={className} />;
    case 'flame':
      return <Flame size={size} className={className} />;
    case 'sparkles':
      return <Sparkles size={size} className={className} />;
    case 'award':
      return <Award size={size} className={className} />;
    case 'crown':
      return <Crown size={size} className={className} />;
    case 'trophy':
    default:
      return <Trophy size={size} className={className} />;
  }
}

export const BadgeSelectorSheet: React.FC<BadgeSelectorSheetProps> = ({
  isOpen,
  achievements,
  equippedBadgeIds,
  onClose,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(equippedBadgeIds);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(equippedBadgeIds);
      setErrorMessage(null);
    }
  }, [isOpen, equippedBadgeIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  const handleToggle = (badgeId: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    setErrorMessage(null);

    if (selectedIds.includes(badgeId)) {
      setSelectedIds(selectedIds.filter((id) => id !== badgeId));
    } else {
      if (selectedIds.length >= 3) {
        setErrorMessage('Bạn chỉ có thể hiển thị tối đa 3 huy hiệu trên hồ sơ.');
        return;
      }
      setSelectedIds([...selectedIds, badgeId]);
    }
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] max-h-[88vh] bg-app-surface rounded-t-bento p-5 pb-8 border-t border-app-border shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-app-border mx-auto -mt-1 mb-0.5" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-app-border/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-app-muted tracking-widest uppercase">
                DANH HIỆU & HUY HIỆU
              </span>
              <span className="px-2 py-0.5 rounded-full bg-app-primary/10 text-app-primary text-[10px] font-black border border-app-primary/20">
                Đã mở {unlockedCount}/{achievements.length}
              </span>
            </div>
            <h3 className="text-base font-black text-app-text mt-0.5">
              Chọn huy hiệu hiển thị ({selectedIds.length}/3)
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

        {/* Short Note on Local Storage */}
        <div className="px-3 py-2 rounded-xl bg-app-background/70 border border-app-border/60 flex items-center gap-2 text-app-muted text-xs">
          <Info size={14} className="text-app-primary shrink-0" />
          <span>Lựa chọn huy hiệu được lưu an toàn trên thiết bị này.</span>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-btn bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs font-bold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Badges List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 py-1 max-h-[50vh]">
          {achievements.map((badge) => {
            const isSelected = selectedIds.includes(badge.id);
            const isUnlocked = badge.isUnlocked;

            return (
              <div
                key={badge.id}
                onClick={() => handleToggle(badge.id, isUnlocked)}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                  !isUnlocked
                    ? 'bg-app-background/40 border-app-border/40 opacity-55 cursor-not-allowed'
                    : isSelected
                    ? 'bg-app-mint/40 border-app-primary shadow-xs cursor-pointer active:scale-[0.99]'
                    : 'bg-app-background border-app-border hover:border-app-primary/50 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {/* Icon Container */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    !isUnlocked
                      ? 'bg-app-surface text-app-muted border-app-border/40'
                      : isSelected
                      ? 'bg-app-primary text-app-on-primary border-app-primary'
                      : 'bg-app-surface text-app-primary border-app-primary/20'
                  }`}
                >
                  {isUnlocked ? (
                    renderBadgeIcon(badge.iconName, 18)
                  ) : (
                    <Lock size={16} className="text-app-muted" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm truncate ${
                        isSelected
                          ? 'font-black text-app-primary'
                          : isUnlocked
                          ? 'font-bold text-app-text'
                          : 'font-semibold text-app-muted'
                      }`}
                    >
                      {badge.title}
                    </span>
                    {isUnlocked && (
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-app-primary border-app-primary text-app-on-primary'
                            : 'border-app-border bg-app-surface'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-app-muted mt-0.5 line-clamp-2 font-medium">
                    {badge.description}
                  </p>

                  {/* Unlock Hint or Progress */}
                  <div className="mt-2 flex items-center gap-2">
                    {!isUnlocked ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-app-muted">
                        <span className="text-app-loss">🔒 {badge.unlockHint}</span>
                        {badge.progressText && (
                          <span className="text-app-muted/80">({badge.progressText})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-black text-app-primary">
                        ✓ Đã đạt cột mốc
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-app-border/40 flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            className="flex-1 uppercase tracking-wider text-xs font-black"
          >
            HỦY
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            className="flex-2 uppercase tracking-wider text-xs font-black shadow-xs"
          >
            LƯU LỰA CHỌN ({selectedIds.length}/3)
          </Button>
        </div>
      </div>
    </div>
  );
};
