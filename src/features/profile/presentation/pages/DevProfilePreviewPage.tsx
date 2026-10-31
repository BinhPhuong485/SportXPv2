import React from 'react';
import { PageContent } from '../../../../shared/components/PageContent';
import { PlayerProfile, MatchDiaryItem } from '../../domain/playerProfile';
import { CalendarEvent } from '../../../calendar/domain/calendarEvent';
import {
  computeProfileStats,
  computeEloHistoryPoints,
  computeClientAchievements,
} from '../../domain/profileStats';

import { AthleteHeaderCard } from '../widgets/AthleteHeaderCard';
import { StatsGrid } from '../widgets/StatsGrid';
import { RecentFormDots } from '../widgets/RecentFormDots';
import { EloHistoryChart } from '../widgets/EloHistoryChart';
import { AchievementsSection } from '../widgets/AchievementsSection';
import { ProfileUpcomingSection } from '../widgets/ProfileUpcomingSection';
import { ReminderSettingsCard } from '../../../reminders/presentation/widgets/ReminderSettingsCard';
import { PerformanceMetricsCard } from '../widgets/PerformanceMetricsCard';
import { MatchDiarySection } from '../widgets/MatchDiarySection';
import { HealthSyncCard } from '../widgets/HealthSyncCard';

// DEV-ONLY FIXTURES (Tree-shaken in production builds)
const FIXTURE_PROFILE: PlayerProfile = {
  id: 'fixture-athlete-id',
  publicId: 'PRO-999',
  socialVisibility: 'public',
  displayName: 'Nguyễn Văn Hoàng',
  avatarUrl: undefined,
  eloRating: 885,
  tierName: 'Trung bình khá',
  trustScore: 98,
  winStreak: 4,
  homeCourtId: 'court-binhtrieu',
  homeCourtName: 'Sân Cầu Lông Bình Triệu',
  createdAt: '2026-03-15T08:00:00.000Z',
  onboardingStep: 5,
  isIdentityVerified: true,
  confirmedMatchesCount: 28,
  rankDelta: 3,
};

const FIXTURE_MATCHES: MatchDiaryItem[] = [
  {
    id: 'm-10',
    courtName: 'Sân Cầu Lông Bình Triệu',
    teamA: 'Hoàng, Minh',
    teamB: 'Tuấn, Dũng',
    score: '21-18, 21-16',
    isWin: true,
    eloChange: 18,
    createdAt: '2026-10-31T09:30:00.000Z',
  },
  {
    id: 'm-9',
    courtName: 'Sân Cầu Lông Bình Triệu',
    teamA: 'Hoàng, Phương',
    teamB: 'Hải, Long',
    score: '21-19, 22-20',
    isWin: true,
    eloChange: 16,
    createdAt: '2026-10-29T18:00:00.000Z',
  },
  {
    id: 'm-8',
    courtName: 'Sân Kỳ Hòa',
    teamA: 'Hoàng, Nam',
    teamB: 'Bách, Toàn',
    score: '21-15, 21-17',
    isWin: true,
    eloChange: 20,
    createdAt: '2026-10-27T17:30:00.000Z',
  },
  {
    id: 'm-7',
    courtName: 'Sân Kỳ Hòa',
    teamA: 'Hoàng, Minh',
    teamB: 'Đức, Việt',
    score: '18-21, 21-19, 21-18',
    isWin: true,
    eloChange: 15,
    createdAt: '2026-10-24T19:00:00.000Z',
  },
  {
    id: 'm-6',
    courtName: 'Sân Hồ Sen',
    teamA: 'Hoàng, Sơn',
    teamB: 'Hùng, Cường',
    score: '17-21, 19-21',
    isWin: false,
    eloChange: -14,
    createdAt: '2026-10-21T18:30:00.000Z',
  },
  {
    id: 'm-5',
    courtName: 'Sân Cầu Lông Bình Triệu',
    teamA: 'Hoàng, Tuấn',
    teamB: 'Bình, An',
    score: '21-14, 21-16',
    isWin: true,
    eloChange: 17,
    createdAt: '2026-10-18T20:00:00.000Z',
  },
  {
    id: 'm-4',
    courtName: 'Sân Cầu Lông Bình Triệu',
    teamA: 'Hoàng, Nam',
    teamB: 'Thắng, Lợi',
    score: '19-21, 20-22',
    isWin: false,
    eloChange: -15,
    createdAt: '2026-10-14T18:00:00.000Z',
  },
  {
    id: 'm-3',
    courtName: 'Sân Kỳ Hòa',
    teamA: 'Hoàng, Minh',
    teamB: 'Kiên, Định',
    score: '21-16, 21-19',
    isWin: true,
    eloChange: 18,
    createdAt: '2026-10-10T17:30:00.000Z',
  },
  {
    id: 'm-2',
    courtName: 'Sân Cầu Lông Bình Triệu',
    teamA: 'Hoàng, Long',
    teamB: 'Quân, Huy',
    score: '21-13, 21-15',
    isWin: true,
    eloChange: 19,
    createdAt: '2026-10-06T19:30:00.000Z',
  },
  {
    id: 'm-1',
    courtName: 'Sân Kỳ Hòa',
    teamA: 'Hoàng, Minh',
    teamB: 'Vinh, Quang',
    score: '21-17, 21-14',
    isWin: true,
    eloChange: 16,
    createdAt: '2026-10-02T18:00:00.000Z',
  },
];

const FIXTURE_EVENTS: CalendarEvent[] = [
  {
    id: 'room-fix-1',
    title: 'Giao lưu Đôi Nam Nữ - TBY/TB',
    subtitle: 'Sân Cầu Lông Bình Triệu',
    type: 'hosting',
    status: 'OPEN',
    isCancelled: false,
    startsAt: new Date(Date.now() + 35 * 60 * 1000), // in 35 mins
    endsAt: new Date(Date.now() + 155 * 60 * 1000),
    isAllDay: false,
    roomCode: 'BT-8899',
  },
  {
    id: 'tournament-fix-2',
    title: 'Giải Cầu Lông Thu Đông SportXP 2026',
    subtitle: 'CLB Cầu Lông Phú Thọ',
    type: 'tournament',
    status: 'UPCOMING',
    isCancelled: false,
    startsAt: new Date(Date.now() + 48 * 3600 * 1000),
    endsAt: new Date(Date.now() + 48 * 3600 * 1000),
    isAllDay: true,
  },
];

export const DevProfilePreviewPage: React.FC = () => {
  const stats = computeProfileStats(FIXTURE_MATCHES);
  const eloPoints = computeEloHistoryPoints(FIXTURE_MATCHES, FIXTURE_PROFILE.eloRating ?? 885);
  const achievements = computeClientAchievements({
    stats,
    eloRating: FIXTURE_PROFILE.eloRating ?? 885,
    roomsHostedCount: 3,
    tournamentsRegisteredCount: 1,
  });

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      {/* Dev preview banner */}
      <div className="bg-app-streak/20 border-b border-app-streak/40 px-4 py-2 text-center text-xs font-black text-app-streak">
        🛠 CHẾ ĐỘ DEV PREVIEW — DỮ LIỆU MẪU ĐỂ XÁC MINH GIAO DIỆN HỒ SƠ ĐẦY ĐỦ
      </div>

      <PageContent>
        {/* 1. Athlete Hero */}
        <AthleteHeaderCard
          player={FIXTURE_PROFILE}
          homeCourtRankOverride={{
            rank: 3,
            totalPlayers: 48,
            courtName: 'Sân Cầu Lông Bình Triệu',
            courtId: 'court-binhtrieu',
            pointsToNextRank: 24,
            nextPlayerName: 'Võ Minh Quân',
            isPodium: true,
            tier: null,
            elo: 885,
            rankDelta: 2,
          }}
        />

        {/* 2. Stats Grid */}
        <StatsGrid stats={stats} sourceNote="Dữ liệu mẫu preview 10 trận" />

        {/* 3. Recent Form */}
        <RecentFormDots form={stats.recentForm} />

        {/* 4. Elo History Chart */}
        <EloHistoryChart points={eloPoints} />

        {/* 5. Achievements Section */}
        <AchievementsSection achievements={achievements} />

        {/* 6. Upcoming Block */}
        <ProfileUpcomingSection
          events={FIXTURE_EVENTS}
          roomsHostedCount={3}
          roomsJoinedCount={8}
          tournamentsCount={1}
        />

        {/* 7. Reminder Settings */}
        <ReminderSettingsCard />

        {/* 8. Performance Metrics */}
        <PerformanceMetricsCard player={FIXTURE_PROFILE} />

        {/* 9. Match Diary */}
        <MatchDiarySection matches={FIXTURE_MATCHES} loading={false} />

        {/* 10. Health Connect */}
        <HealthSyncCard />
      </PageContent>
    </div>
  );
};
