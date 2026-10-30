import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { Button } from '../../shared/components/Button';
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
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-3 border-app-primary border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-app-muted font-medium">Đang tải hồ sơ vận động viên…</p>
        </div>
      </PageContent>
    );
  }

  if (!profile) {
    return (
      <PageContent>
        <BentoCard doubleBezel>
          <div className="flex flex-col gap-2 text-center py-4">
            <h3 className="text-lg font-black text-app-text">Hồ sơ chưa khả dụng</h3>
            <p className="text-xs text-app-muted">
              Bạn đã đăng nhập nhưng chưa tải được hồ sơ. Hãy thử tải lại hoặc đăng xuất để đăng nhập lại.
            </p>
          </div>
        </BentoCard>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={loadData}
            icon={<RefreshCw size={16} />}
            className="w-full uppercase tracking-wider text-xs font-black shadow-xs"
          >
            TẢI LẠI HỒ SƠ
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={signOut}
            icon={<LogOut size={16} />}
            className="w-full uppercase tracking-wider text-xs font-black"
          >
            ĐĂNG XUẤT
          </Button>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-btn bg-app-mint border border-app-primary/30 text-app-primary text-xs font-black text-center shadow-xs animate-in fade-in duration-200">
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
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button
          variant="outline"
          size="lg"
          onClick={loadData}
          icon={<RefreshCw size={16} />}
          className="uppercase tracking-wider text-xs font-black shadow-2xs"
        >
          CẬP NHẬT
        </Button>
        <Button
          variant="danger"
          size="lg"
          onClick={signOut}
          icon={<LogOut size={16} />}
          className="uppercase tracking-wider text-xs font-black shadow-2xs"
        >
          ĐĂNG XUẤT
        </Button>
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
