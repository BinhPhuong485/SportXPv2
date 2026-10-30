import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { PlayerProfile, MatchDiaryItem } from './domain/playerProfile';
import { profileRepository } from './data/profileRepository';
import { AthleteHeaderCard } from './presentation/widgets/AthleteHeaderCard';
import { PerformanceMetricsCard } from './presentation/widgets/PerformanceMetricsCard';
import { HealthSyncCard } from './presentation/widgets/HealthSyncCard';
import { MatchDiarySection } from './presentation/widgets/MatchDiarySection';
import { EditProfileSheet } from './presentation/widgets/EditProfileSheet';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [matches, setMatches] = useState<MatchDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await profileRepository.currentProfile();
      setProfile(data);

      if (data?.displayName) {
        setMatchesLoading(true);
        profileRepository
          .playerRecentMatches(data.displayName)
          .then((list) => setMatches(list))
          .finally(() => setMatchesLoading(false));
      }
    } catch (err: unknown) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProfile = async (displayName: string, homeCourtId: string | null) => {
    await profileRepository.updateProfile({ displayName, homeCourtId });
    setFeedback('Đã cập nhật hồ sơ thành công.');
    setTimeout(() => setFeedback(null), 3000);
    await loadData();
  };

  if (loading && !profile) {
    return (
      <PageContent>
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-2 border-app-primary border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-app-muted">Đang tải hồ sơ vận động viên…</p>
        </div>
      </PageContent>
    );
  }

  if (!profile) {
    return (
      <PageContent>
        <BentoCard>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-app-text">Hồ sơ chưa khả dụng</h3>
            <p className="text-sm text-app-muted">
              Bạn đã đăng nhập nhưng chưa tải được hồ sơ. Hãy thử tải lại hoặc đăng xuất để đăng nhập lại.
            </p>
          </div>
        </BentoCard>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={loadData}
            className="w-full h-11 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs uppercase flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-xs"
          >
            <RefreshCw size={16} />
            <span>TẢI LẠI HỒ SƠ</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="w-full h-11 rounded-[12px] bg-app-surface border border-app-border text-app-loss font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-app-loss/10 transition-all"
          >
            <LogOut size={16} />
            <span>ĐĂNG XUẤT</span>
          </button>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3 rounded-xl bg-app-mint/30 border border-app-primary/30 text-app-primary text-xs font-bold text-center animate-in fade-in duration-200">
          ✓ {feedback}
        </div>
      )}

      {/* 1. ATHLETE IDENTITY HEADER (Circular Elo Meter, Rank Progress, Calibration) */}
      <AthleteHeaderCard
        player={profile}
        onEdit={() => setIsEditOpen(true)}
      />

      {/* 2. PERFORMANCE METRICS CARD (Chuỗi thắng & Điểm uy tín) */}
      <PerformanceMetricsCard player={profile} />

      {/* 3. MATCH DIARY / LỊCH SỬ THI ĐẤU (Truy vấn match_results từ Supabase) */}
      <MatchDiarySection matches={matches} loading={matchesLoading} />

      {/* 4. HARDWARE & HEALTH CONNECT (HealthKit / Health Connect) */}
      <HealthSyncCard />

      {/* 5. ACTION BUTTONS: CẬP NHẬT & ĐĂNG XUẤT */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={loadData}
          className="flex-1 h-12 rounded-[12px] border border-app-border bg-app-surface text-app-muted hover:text-app-text text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        >
          <RefreshCw size={16} />
          <span>CẬP NHẬT</span>
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex-1 h-12 rounded-[12px] border border-app-border bg-app-surface text-app-loss hover:bg-app-loss/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        >
          <LogOut size={16} />
          <span>ĐĂNG XUẤT</span>
        </button>
      </div>

      {/* Edit Profile Bottom Sheet */}
      <EditProfileSheet
        isOpen={isEditOpen}
        profile={profile}
        loadCourts={() => profileRepository.loadCourts()}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
      />
    </PageContent>
  );
};
