import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LogOut } from 'lucide-react';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';
import { Button } from '../../shared/components/Button';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { MatchDiaryItem } from './domain/playerProfile';
import { profileRepository } from './data/profileRepository';
import { calendarRepository } from '../calendar/data/calendarRepository';
import { CalendarEvent } from '../calendar/domain/calendarEvent';
import {
  computeProfileStats,
  computeEloHistoryPoints,
  computeClientAchievements,
} from './domain/profileStats';
import {
  getStoredEquippedBadgeIds,
  saveStoredEquippedBadgeIds,
  resolveEquippedBadges,
} from './domain/badgeSelection';

import { AthleteHeaderCard } from './presentation/widgets/AthleteHeaderCard';
import { PerformanceMetricsCard } from './presentation/widgets/PerformanceMetricsCard';
import { StatsGrid } from './presentation/widgets/StatsGrid';
import { RecentFormDots } from './presentation/widgets/RecentFormDots';
import { EloHistoryChart } from './presentation/widgets/EloHistoryChart';
import { ProfileUpcomingSection } from './presentation/widgets/ProfileUpcomingSection';
import { MatchDiarySection } from './presentation/widgets/MatchDiarySection';
import { ReminderSettingsCard } from '../reminders/presentation/widgets/ReminderSettingsCard';
import { EditProfileSheet } from './presentation/widgets/EditProfileSheet';
import { BadgeSelectorSheet } from './presentation/widgets/BadgeSelectorSheet';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, loadProfile, signOut } = useAuthStore();
  const [matches, setMatches] = useState<MatchDiaryItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBadgeSheetOpen, setIsBadgeSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Custom user badge choices stored in localStorage
  const [customBadgeIds, setCustomBadgeIds] = useState<string[] | null>(() =>
    user?.id ? getStoredEquippedBadgeIds(user.id) : null
  );

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [profileData, eventsData] = await Promise.all([
        loadProfile(),
        calendarRepository.loadUserCalendarEvents(),
      ]);

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
  }, [user, loadProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync stored badges when user ID is available
  useEffect(() => {
    if (user?.id) {
      setCustomBadgeIds(getStoredEquippedBadgeIds(user.id));
    }
  }, [user?.id]);

  const handleSaveProfile = async (displayName: string, homeCourtId: string | null) => {
    await updateProfile({ displayName, homeCourtId });
    setFeedback('Đã cập nhật hồ sơ thành công.');
    setTimeout(() => setFeedback(null), 3000);
    if (displayName) {
      profileRepository.playerRecentMatches(displayName).then(setMatches);
    }
  };

  const handleLoadCourts = useCallback(() => profileRepository.loadCourts(), []);

  const handleSaveBadges = (newIds: string[]) => {
    if (user?.id) {
      saveStoredEquippedBadgeIds(user.id, newIds);
    }
    setCustomBadgeIds(newIds);
    setFeedback('Đã cập nhật danh hiệu hiển thị.');
    setTimeout(() => setFeedback(null), 3000);
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

  // Compute stats and achievements from user data
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

  const { equipped: equippedBadges } = resolveEquippedBadges({
    achievements,
    storedBadgeIds: customBadgeIds,
  });

  return (
    <PageContent>
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-btn bg-app-mint border border-app-primary/30 text-app-primary text-xs font-black text-center shadow-xs animate-in fade-in duration-200">
          ✓ {feedback}
        </div>
      )}

      {/* 1. ATHLETE IDENTITY HERO (with up to 3 badge chips, tier ring, Elo gauge, court rank) */}
      <AthleteHeaderCard
        player={profile}
        equippedBadges={equippedBadges}
        onEdit={() => setIsEditOpen(true)}
        onOpenBadges={() => setIsBadgeSheetOpen(true)}
      />

      {/* 2. WIN STREAK & TRUST SCORE CARD (Moved up directly below hero per Problem 2) */}
      <PerformanceMetricsCard player={profile} />

      {/* 3. STATS GRID (6 metrics, honestly labeled) */}
      <StatsGrid stats={stats} sourceNote="Dựa trên 20 trận gần nhất" />

      {/* 4. RECENT FORM (10 W/L dots) */}
      <RecentFormDots form={stats.recentForm} />

      {/* 5. ELO HISTORY CHART (Hand-built SVG line chart) */}
      <EloHistoryChart points={eloHistoryPoints} />

      {/* 6. "SẮP TỚI" (Upcoming events and activity counts) */}
      <ProfileUpcomingSection
        events={events}
        roomsHostedCount={roomsHosted}
        roomsJoinedCount={roomsJoined}
        tournamentsCount={tournamentsCount}
      />

      {/* 7. "HOẠT ĐỘNG" (Recent matches diary) */}
      <MatchDiarySection matches={matches} loading={matchesLoading} />

      {/* 8. REMINDER SETTINGS ("Nhắc lịch" settings card) */}
      <ReminderSettingsCard />

      {/* 9. ACTIONS (Refresh & Sign out) */}
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
        loadCourts={handleLoadCourts}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Badge Selector Bottom Sheet */}
      <BadgeSelectorSheet
        isOpen={isBadgeSheetOpen}
        achievements={achievements}
        equippedBadgeIds={equippedBadges.map((b) => b.id)}
        onClose={() => setIsBadgeSheetOpen(false)}
        onSave={handleSaveBadges}
      />
    </PageContent>
  );
};
