import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { Button } from '../../shared/components/Button';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { PlayerProfile, MatchDiaryItem } from './domain/playerProfile';
import { profileRepository } from './data/profileRepository';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import {
  computeProfileStats,
  computeEloHistoryPoints,
  computeClientAchievements,
} from './domain/profileStats';

import { AthleteHeaderCard } from './presentation/widgets/AthleteHeaderCard';
import { StatsGrid } from './presentation/widgets/StatsGrid';
import { RecentFormDots } from './presentation/widgets/RecentFormDots';
import { EloHistoryChart } from './presentation/widgets/EloHistoryChart';
import { AchievementsSection } from './presentation/widgets/AchievementsSection';
import { ProfileUpcomingSection } from './presentation/widgets/ProfileUpcomingSection';
import { ReminderSettingsCard } from '../reminders/presentation/widgets/ReminderSettingsCard';
import { PerformanceMetricsCard } from './presentation/widgets/PerformanceMetricsCard';
import { MatchDiarySection } from './presentation/widgets/MatchDiarySection';
import { HealthSyncCard } from './presentation/widgets/HealthSyncCard';
import { EditProfileSheet } from './presentation/widgets/EditProfileSheet';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [matches, setMatches] = useState<MatchDiaryItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [profileData, eventsData] = await Promise.all([
        profileRepository.currentProfile(),
        calendarRepository.loadUserCalendarEvents(),
      ]);

      setProfile(profileData);
      setEvents(eventsData);

      if (profileData?.displayName) {
        setMatchesLoading(true);
        profileRepository
          .playerRecentMatches(profileData.displayName)
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

  // Compute stats and charts from user-specific sources only
  const stats = computeProfileStats(matches);
  const eloHistoryPoints = computeEloHistoryPoints(matches, profile.eloRating ?? 750);
  const roomsHosted = events.filter((e) => e.type === 'hosting').length;
  const roomsJoined = events.filter((e) => e.type === 'joined' || e.type === 'hosting').length;
  const tournamentsCount = events.filter((e) => e.type === 'tournament').length;
  const achievements = computeClientAchievements({
    stats,
    eloRating: profile.eloRating ?? 750,
    roomsHostedCount: roomsHosted,
    tournamentsRegisteredCount: tournamentsCount,
  });

  return (
    <PageContent>
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-btn bg-app-mint border border-app-primary/30 text-app-primary text-xs font-black text-center shadow-xs animate-in fade-in duration-200">
          ✓ {feedback}
        </div>
      )}

      {/* 1. ATHLETE IDENTITY HERO (Initials avatar with tier ring, Elo meter, Court rank, Member since) */}
      <AthleteHeaderCard
        player={profile}
        onEdit={() => setIsEditOpen(true)}
      />

      {/* 2. STATS GRID (6 metrics, honestly labeled) */}
      <StatsGrid stats={stats} sourceNote="Dựa trên 20 trận gần nhất" />

      {/* 3. RECENT FORM (10 W/L dots) */}
      <RecentFormDots form={stats.recentForm} />

      {/* 4. ELO HISTORY CHART (Hand-built SVG line chart) */}
      <EloHistoryChart points={eloHistoryPoints} />

      {/* 5. ACHIEVEMENTS SECTION (Client-evaluated badges) */}
      <AchievementsSection achievements={achievements} />

      {/* 6. UPCOMING EVENTS & COUNTS BLOCK */}
      <ProfileUpcomingSection
        events={events}
        roomsHostedCount={roomsHosted}
        roomsJoinedCount={roomsJoined}
        tournamentsCount={tournamentsCount}
      />

      {/* 7. REMINDERS SETTINGS CARD ("Nhắc lịch" card with offline notice & calendar link) */}
      <ReminderSettingsCard />

      {/* 8. PERFORMANCE METRICS CARD (Chuỗi thắng & Điểm uy tín - Flutter parity) */}
      <PerformanceMetricsCard player={profile} />

      {/* 9. MATCH DIARY / LỊCH SỬ THI ĐẤU (Flutter parity) */}
      <MatchDiarySection matches={matches} loading={matchesLoading} />

      {/* 10. HARDWARE & HEALTH CONNECT (HealthKit / Health Connect) */}
      <HealthSyncCard />

      {/* 11. ACTION BUTTONS: CẬP NHẬT & ĐĂNG XUẤT */}
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
