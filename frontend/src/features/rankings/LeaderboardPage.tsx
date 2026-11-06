import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Trophy,
  TrendingUp,
  Medal,
  Globe,
  ShieldCheck,
  Search,
  Flame,
  Rocket,
  BarChart3,
  Swords,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { Court, PlayerProfile } from '../../core/types/database.types';
import {
  leaderboardRepository,
  LeaderboardScope,
  PlayerCourtRank,
} from './data/leaderboardRepository';
import { CourtPickerSheet } from './presentation/widgets/CourtPickerSheet';
import { PlayerDetailModal } from './presentation/widgets/PlayerDetailModal';

// Competitive Athlete interface for high-tier ladder representation
interface CompetitiveAthlete {
  id: string;
  rank: number;
  rankDelta: number; // positive = up, negative = down, 0 = unchanged
  displayName: string;
  avatarUrl: string;
  tier: string;
  club: string;
  eloRating: number;
  dailyDelta: number;
  winRate: number;
  wins: number;
  losses: number;
  streak: string;
  form: ('W' | 'L')[];
  isVerified: boolean;
}

const STITCH_CHAMPIONS: CompetitiveAthlete[] = [
  {
    id: 'champ-1',
    rank: 1,
    rankDelta: 0,
    displayName: 'Đặng Đình Khang',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMHMQdH8ii1vvnGydpnMosMkCk503jAZqI1MJ0oQ9ArXrKgcsGlJgtrJeS9KLWeMay1Sga9QWLQLvojC3muQghlPvL0tlGP54ge_ydXCUhC2gCSiJTczOnzIdy8Mnwmew-qX2JLqxKsrfaZePYQJ3b_VcdgmNLEi28vKSodhlK4ZWMMSKVsoTbHSDVw00CHwUpxKERnD0NBO_qelCu5gY7Y3g5u2SVcfVQiqIUX1Q',
    tier: 'Grandmaster',
    club: 'Quốc Gia PRO Circuit',
    eloRating: 2480,
    dailyDelta: 38,
    winRate: 94.2,
    wins: 65,
    losses: 4,
    streak: 'Chuỗi 14 trận bất bại',
    form: ['W', 'W', 'W', 'W', 'W'],
    isVerified: true,
  },
  {
    id: 'champ-2',
    rank: 2,
    rankDelta: 2,
    displayName: 'Nguyễn Hải Đăng',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYkCkKMF4AgLQ6wS_73oIEuvNuKujowkx3qckP9K9GMGMneJsZnbJ-0PqUkp-VkazzB2IeX15qpKIgCNnx796Riyq-_OFQMXEb5bEUl78TByu2qgegIbh_4Ql8cJTFkzJfxE3NxGuuxk963QWoTxEkgKIrohQeTPE7UcuC9pwvZfQy_48k6kkuR7TQsMTbqwNcnvp_mck0cvEnVNCIVdkcBrf3y_knrs-Ao907hORz',
    tier: 'Master',
    club: 'CLB Tân Bình Smashers',
    eloRating: 2415,
    dailyDelta: 32,
    winRate: 88.0,
    wins: 44,
    losses: 6,
    streak: 'Chuỗi 6W',
    form: ['W', 'W', 'W', 'L', 'W'],
    isVerified: true,
  },
  {
    id: 'champ-3',
    rank: 3,
    rankDelta: 1,
    displayName: 'Lê Minh Tuấn',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLotCvgxOZ0Z9P8MLZpbzZEfrmnOAE5EahVMxsmdppz2XB95Ypvm9yXNxSOQFpSZDQR4LwuHxgZEa65eWdXSTkizpdDFcRke_E6P_0f1Py1Weju25Fcz1cPhxgceVGMVGtQ2-2xIkaY2cc0XuLVDYpuvFORFtBdeq2ZPPCEu1OTStalUssfnRuJSErL41wWDAtHnmffeX0cDOpASToab5ON4_Gol5nzd7kDP3Yhkjt',
    tier: 'Master',
    club: 'CLB Ba Đình Sports',
    eloRating: 2390,
    dailyDelta: 18,
    winRate: 85.0,
    wins: 51,
    losses: 9,
    streak: 'Chuỗi 4W',
    form: ['W', 'W', 'L', 'W', 'W'],
    isVerified: true,
  },
];

const STITCH_LADDER_TABLE: CompetitiveAthlete[] = [
  {
    id: 'ladder-4',
    rank: 4,
    rankDelta: 2,
    displayName: 'Hoàng Anh Vũ',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyfa_dXBN6z_hf94njC0bl3s9zMn0GYhe-kegSh1-xkvwfZ0kJOqNxHEgzh2vxT2AQf83x1DqHVY78tu6-32TEjcn4TL6HAGRrYayfcqm0W45LkbIXkPC9hFHQeEh0pRqVzW__NxNma_Bbv0kNYi5yqb5b-W78XEvqBZGzDL4t-V4NOoSsaNxwVP4XkClfx7yO5bwGnCbCYXf-zdt3c_olO0dKrTlK1vE10_ZhVKaz',
    tier: 'Master I',
    club: 'CLB Cầu Giấy Pro',
    eloRating: 2350,
    dailyDelta: 14,
    winRate: 82.1,
    wins: 46,
    losses: 10,
    streak: 'Chuỗi 3W',
    form: ['W', 'W', 'W', 'L', 'W'],
    isVerified: true,
  },
  {
    id: 'ladder-5',
    rank: 5,
    rankDelta: -1,
    displayName: 'Phạm Quốc Bảo',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAxWUIqoJdHmPYc6lS3rNsPD6XkLBqZ2wuAeNB-8zpMamYi_dhrwXNUuf-9STz1PVLPl5XUUYa6T3IX0fqU2xIsdDopmwJvbkbzBQSDY0XyTGCOODS0zSiCxAV9pL6h2BR2mvipj7NXH2P4kPEnzX9pDXEfvBX8-2ZZIrvdVpBiKrvUzARlxMJqubnXEY_aqzl92silaBisKWu2rTmciwjeWar5_gvVGhloJUhaMq69',
    tier: 'Master I',
    club: 'CLB Quận 7 Smash',
    eloRating: 2310,
    dailyDelta: -6,
    winRate: 79.5,
    wins: 43,
    losses: 11,
    streak: '1L',
    form: ['W', 'L', 'W', 'W', 'L'],
    isVerified: true,
  },
  {
    id: 'ladder-6',
    rank: 6,
    rankDelta: 0,
    displayName: 'Trần Đức Thắng',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYoW7m0xX_I3cG9l3nT2N8S4k6p41GdWv-dFwhQFVMNxVFmIiRZyQ4xC8fHYscDd213P422x8dEWhCNF8lRg3CTz8aLgv__4q9Pkavjb0leLfi3Sz-lB9q5mHepmgdjrpO5HTzf9C-_48BmnTjeqHJVQpylsoO5u9nyu1Xf82e2hrETVRl23vp2IkEhv3K4NimebUi-oAXjkusPWvvh1psTd_ADnHQv0A4EpuBSPd',
    tier: 'Diamond III',
    club: 'CLB Đống Đa Hà Nội',
    eloRating: 2285,
    dailyDelta: 8,
    winRate: 78.0,
    wins: 39,
    losses: 11,
    streak: 'Chuỗi 5W',
    form: ['W', 'W', 'W', 'W', 'W'],
    isVerified: false,
  },
  {
    id: 'ladder-7',
    rank: 7,
    rankDelta: 4,
    displayName: 'Vũ Đình Quân',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBjpbZjcaSjT9J9Jf4ESMOOWLIQfMIdhn5xsdIiv8_DPg773_VIlwHirWxKSInUxv2aBRzBSl4RG2ohwCHLWzHD0OE3Ok35V2RLwTy9wSSf9BbNx6Hgw47ome6CDKSuVutdVfiftmv9_Myuo3dWr1oTGvIlqjmTI5Qlt00qLbhngrdKcWgGYku--4HCqBhjQ5hNk4vJ_vuHR4WmWXKtj4FliQpc1j0hiRFhskE3Jf__',
    tier: 'Diamond III',
    club: 'CLB Hải Phòng Elite',
    eloRating: 2260,
    dailyDelta: 26,
    winRate: 77.3,
    wins: 41,
    losses: 12,
    streak: 'Chuỗi 2W',
    form: ['W', 'W', 'L', 'W', 'W'],
    isVerified: true,
  },
  {
    id: 'ladder-8',
    rank: 8,
    rankDelta: -2,
    displayName: 'Bùi Hoàng Nam',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCbwZuhhoc6YpKI-kCGffWmwjI8bPXePRgcxcj50rs8P_OPDyfbUTPhD2aRzmrUZzT5Sc6-wBiwAmJxz87n-bNFaV-81Ko01cOW86dNPCIYwkmtxl5MkXWdrJgwXEqYSuHYL9XvrqjVvFViFbt9jpIPfYp04j-_VK4EspiDVbun0_aREnMawl2Aatdg8HUo6zU7VQnForLPKBYxSyk9982qM9M8DJulidf6sEOlaj9o',
    tier: 'Diamond II',
    club: 'CLB Đà Nẵng Rackets',
    eloRating: 2240,
    dailyDelta: -11,
    winRate: 75.0,
    wins: 36,
    losses: 12,
    streak: 'Chuỗi 3W',
    form: ['L', 'L', 'W', 'W', 'W'],
    isVerified: false,
  },
  {
    id: 'ladder-9',
    rank: 9,
    rankDelta: 0,
    displayName: 'Nguyễn Tiến Minh Jr',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDKVFalyPa7CCEtrilAyW_rAVXP9MeuL0FrUWt7RuX1i7fpM3PidUlQ8axgT6F1uvd0OztE4LUEwn3Ujzg_952RaICOzzNaPakOsUFA6vvtnTKS0OhU47HJEaQgQOjQ3OMzDO1T5cSDqenAPK7pkWVnTyTQtV7TIix_LvJIsf83v64K1wJfbxJtxLq66Qn9MBNcXIJTPDliKt97J2oAvMFANHv28tEQmm_BY-IpNKQ9',
    tier: 'Diamond II',
    club: 'CLB Kỳ Hòa TP.HCM',
    eloRating: 2215,
    dailyDelta: 2,
    winRate: 74.5,
    wins: 38,
    losses: 13,
    streak: 'Chuỗi 4W',
    form: ['W', 'L', 'W', 'W', 'W'],
    isVerified: true,
  },
  {
    id: 'ladder-10',
    rank: 10,
    rankDelta: 1,
    displayName: 'Lê Khắc Việt',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCb36npjaAMexMPhx6BNO4Ced2BLLjb5D0CMSBUXeT3nMTjcP8KuvnLJsYeHxCk7LVRj-fdGnwCwf0JiEUjbz_TuArTN9utR2Bayw5FCfhn5MRorh9fmXpwvAgF9B6pp9dRCKGNsJCGf_eCZ1iTXw5VeUtoEKOz9TJJVSquvAsEA1pw9H0NRPVFsb-VHbAmZ3CB6zpIIQz57K-09gF0ixI-WWDLRolud3m4umJFWIJb',
    tier: 'Diamond I',
    club: 'CLB Cung VHTT Hà Nội',
    eloRating: 2185,
    dailyDelta: 19,
    winRate: 73.9,
    wins: 34,
    losses: 12,
    streak: 'Chuỗi 1W',
    form: ['W', 'W', 'W', 'L', 'W'],
    isVerified: false,
  },
];

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const currentUserId = user?.id || '';

  // Filter & Navigation states
  const [selectedSport, setSelectedSport] = useState<'badminton' | 'pickleball' | 'tennis'>('badminton');
  const [selectedBracket, setSelectedBracket] = useState<string>('Đơn Nam');
  const [selectedRegion, setSelectedRegion] = useState<string>('Toàn quốc (VN)');
  const [searchQuery, setSearchQuery] = useState('');

  // 3-tab Scope: 'court' | 'district' | 'national'
  const [scope, setScope] = useState<LeaderboardScope>('national');

  // Metadata from DB
  const [courts, setCourts] = useState<Court[]>([]);
  const [, setDistricts] = useState<string[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [onlyQualified, setOnlyQualified] = useState<boolean>(false);

  // Loaded players from DB
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([]);
  const [userRankSummary, setUserRankSummary] = useState<PlayerCourtRank | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sheets & Modals
  const [isCourtPickerOpen, setIsCourtPickerOpen] = useState(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<{
    player: PlayerProfile;
    rank: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load: Courts & Districts
  const loadInitialMetadata = useCallback(async () => {
    try {
      const [courtList, districtList] = await Promise.all([
        leaderboardRepository.getCourts(),
        leaderboardRepository.getDistricts(),
      ]);
      setCourts(courtList);
      setDistricts(districtList);

      let initialCourtId = selectedCourtId;
      if (!initialCourtId) {
        if (profile?.homeCourtId && courtList.some((c) => c.id === profile.homeCourtId)) {
          initialCourtId = profile.homeCourtId;
        } else if (courtList.length > 0) {
          initialCourtId = courtList[0].id;
        }
        setSelectedCourtId(initialCourtId);
      }

      if (!selectedDistrict && districtList.length > 0) {
        setSelectedDistrict(districtList[0]);
      }
    } catch (e: any) {
      console.warn('Failed loading metadata:', e);
    }
  }, [profile?.homeCourtId, selectedCourtId, selectedDistrict]);

  // 2. Fetch Leaderboard Data
  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      let scopeTitle = 'Bảng xếp hạng';
      let courtIdArg: string | undefined = undefined;

      if (scope === 'court') {
        const c = courts.find((x) => x.id === selectedCourtId);
        scopeTitle = c ? c.name : 'Sân thi đấu';
        courtIdArg = selectedCourtId;
      } else if (scope === 'district') {
        scopeTitle = `Khu vực ${selectedDistrict || 'Quận/Huyện'}`;
      } else {
        scopeTitle = 'Toàn quốc';
      }

      const list = await leaderboardRepository.getLeaderboard({
        scope,
        courtId: scope === 'court' ? selectedCourtId : undefined,
        district: scope === 'district' ? selectedDistrict : undefined,
      });

      setAllPlayers(list);

      if (currentUserId) {
        const rankInfo = leaderboardRepository.getPlayerRank(
          currentUserId,
          list,
          scopeTitle,
          courtIdArg
        );
        setUserRankSummary(rankInfo);
      }
    } catch (e: any) {
      console.warn('Fetch rankings failed:', e);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedCourtId, selectedDistrict, courts, currentUserId]);

  useEffect(() => {
    loadInitialMetadata();
  }, [loadInitialMetadata]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Resolve Podium Champions: prefer DB data if 3+ players, otherwise fallback to STITCH_CHAMPIONS
  const podiumTop3 = useMemo<CompetitiveAthlete[]>(() => {
    if (allPlayers.length >= 3) {
      return allPlayers.slice(0, 3).map((p, idx) => ({
        id: p.id,
        rank: idx + 1,
        rankDelta: idx === 0 ? 0 : idx === 1 ? 2 : 1,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl || STITCH_CHAMPIONS[idx].avatarUrl,
        tier: p.tierName || (idx === 0 ? 'Grandmaster' : 'Master'),
        club: p.homeCourtId ? (courts.find((c) => c.id === p.homeCourtId)?.name || 'CLB Smash Pro') : 'Quốc Gia Circuit',
        eloRating: p.eloRating || (2400 - idx * 30),
        dailyDelta: idx === 0 ? 38 : idx === 1 ? 32 : 18,
        winRate: p.confirmedMatchesCount ? Math.round(((p.confirmedMatchesCount - 2) / p.confirmedMatchesCount) * 100) : 88.5,
        wins: p.confirmedMatchesCount ? Math.max(12, p.confirmedMatchesCount - 2) : 52,
        losses: 4,
        streak: idx === 0 ? 'Chuỗi 14 trận bất bại' : `Chuỗi ${6 - idx * 2}W`,
        form: ['W', 'W', 'W', idx === 1 ? 'L' : 'W', 'W'],
        isVerified: true,
      }));
    }
    return STITCH_CHAMPIONS;
  }, [allPlayers, courts]);

  // Resolve Ladder Rows (Top 4 to 10+): filter by search query
  const ladderList = useMemo<CompetitiveAthlete[]>(() => {
    let source = STITCH_LADDER_TABLE;
    if (allPlayers.length > 3) {
      const dbRest = allPlayers.slice(3).map((p, idx) => ({
        id: p.id,
        rank: idx + 4,
        rankDelta: 0,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl || STITCH_LADDER_TABLE[idx % STITCH_LADDER_TABLE.length].avatarUrl,
        tier: p.tierName || 'Diamond II',
        club: 'CLB Cầu Lông Sài Gòn',
        eloRating: p.eloRating || (2200 - idx * 20),
        dailyDelta: 10,
        winRate: 75.0,
        wins: 30,
        losses: 10,
        streak: 'Chuỗi 3W',
        form: ['W', 'W', 'L', 'W', 'W'] as ('W' | 'L')[],
        isVerified: true,
      }));
      source = [...dbRest, ...STITCH_LADDER_TABLE.slice(dbRest.length)];
    }

    if (onlyQualified) {
      source = source.filter((a) => a.wins + a.losses >= 5);
    }

    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.club.toLowerCase().includes(q) ||
        a.tier.toLowerCase().includes(q)
    );
  }, [allPlayers, onlyQualified, searchQuery]);

  // Current User Standings Telemetry
  const currentUserStanding = useMemo(() => {
    const userElo = profile?.eloRating || 2140;
    const userRank = userRankSummary?.rank || 14;
    const userTier = profile?.tierName ? `${profile.tierName} II` : 'Master II';
    const targetGap = Math.max(25, 2185 - userElo + 15);
    const progressPercent = Math.min(95, Math.max(30, Math.round(((userElo - 1800) / (2200 - 1800)) * 100)));

    return {
      rank: userRank,
      name: profile?.displayName || 'Alex Nguyen',
      avatarUrl:
        profile?.avatarUrl ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBTkHXnz8gK78KeAxzveofzDvYwK11yGxHA3mop7K3w-hnnEi9JsMobrFmDDZcm7IUQgjyaw_o3D3mdN0JirxdjDInRvVKhkk0PxymtIoM_9orlF_huXk77elHBypbFMJhh1u8q23Cp7FEjl2URm3OQUWHqV2aIdjCxNlbaUstGhH1HnoNM8T-7QSTYy_vf2npRlZvohb1YyTKTfSaPy-S-UlFzD67MEo-BT8lsUcEU',
      tier: userTier,
      elo: userElo,
      wins: 38,
      losses: 12,
      winRate: 76.0,
      targetGap,
      progressPercent,
    };
  }, [profile, userRankSummary]);

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 pb-28 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2 border border-slate-700">
          <Sparkles size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* ========================================================================= */}
        {/* SECTION 1: Competitive Filter & Meta Header Bento                         */}
        {/* ========================================================================= */}
        <section className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4">
            {/* Top Meta Row: Live Status & Global Telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider">
                    Hệ Thống Elo Real-time
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-mono">
                  <Calendar size={15} className="text-emerald-700" />
                  <span className="text-slate-900 font-semibold">Mùa 4 - Hè 2026</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">Còn 18 ngày 14 giờ</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                <span>
                  Tổng đấu thủ xếp hạng: <strong className="text-emerald-700 font-bold">14,290</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Chu kỳ cập nhật: <span className="text-slate-900 font-semibold">30 giây</span>
                </span>
                <button
                  onClick={fetchRankings}
                  title="Làm mới dữ liệu"
                  className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
                </button>
              </div>
            </div>

            {/* Sport Selectors & Division Pills */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Sports Switcher Tabs */}
              <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setSelectedSport('badminton')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSport === 'badminton'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>🏸</span>
                  <span>Cầu Lông</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSport('pickleball')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSport === 'pickleball'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>🏓</span>
                  <span>Pickleball</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSport('tennis')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSport === 'tennis'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <span>🎾</span>
                  <span>Tennis</span>
                </button>
              </div>

              {/* Bracket Categorization */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                {['Đơn Nam', 'Đôi Nam', 'Đơn Nữ', 'Đôi Nữ', 'Đôi Nam Nữ (Mix)'].map((bracket) => (
                  <button
                    key={bracket}
                    type="button"
                    onClick={() => setSelectedBracket(bracket)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedBracket === bracket
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-slate-200/60'
                    }`}
                  >
                    {bracket}
                  </button>
                ))}
              </div>

              {/* Region & Scope Selector */}
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 text-xs">
                  <Globe size={15} className="text-slate-500" />
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRegion(val);
                      if (val.includes('CLB')) {
                        setScope('court');
                        setIsCourtPickerOpen(true);
                      } else if (val.includes('Nam') || val.includes('Bắc')) {
                        setScope('district');
                      } else {
                        setScope('national');
                      }
                    }}
                    className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="Toàn quốc (VN)">Toàn quốc (VN)</option>
                    <option value="Miền Nam">Miền Nam</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Khu vực CLB Smash Pro">Sân Thi Đấu CLB...</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setOnlyQualified(!onlyQualified)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                    onlyQualified
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                  }`}
                  title="Chỉ hiển thị vận động viên có ≥ 5 trận xác nhận"
                >
                  <ShieldCheck size={14} className={onlyQualified ? 'text-emerald-700' : 'text-slate-400'} />
                  <span className="hidden sm:inline">≥ 5 trận</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: Podium Grand Stage (Top 3 Vinh Danh)                          */}
        {/* ========================================================================= */}
        <section className="w-full flex flex-col items-center">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-8">
            {/* RANK 2: Silver Stage (Nguyễn Hải Đăng) */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div
                onClick={() =>
                  setSelectedPlayerModal({
                    player: {
                      id: podiumTop3[1].id,
                      displayName: podiumTop3[1].displayName,
                      avatarUrl: podiumTop3[1].avatarUrl,
                      tierName: podiumTop3[1].tier,
                      eloRating: podiumTop3[1].eloRating,
                      confirmedMatchesCount: podiumTop3[1].wins + podiumTop3[1].losses,
                    } as unknown as PlayerProfile,
                    rank: 2,
                  })
                }
                className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-xs group hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="absolute -top-6 w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 shadow-md flex items-center justify-center font-mono text-base text-slate-700 font-bold">
                  2
                </div>

                <div className="relative mt-4 mb-3">
                  <img
                    src={podiumTop3[1].avatarUrl}
                    alt={podiumTop3[1].displayName}
                    className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-slate-100"
                  />
                  <span className="absolute bottom-0 right-0 bg-white p-1 rounded-full text-emerald-600 shadow ring-1 ring-slate-200">
                    <CheckCircle2 size={15} />
                  </span>
                </div>

                <h3 className="text-base text-slate-900 font-bold mb-1">
                  {podiumTop3[1].displayName}
                </h3>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono uppercase font-semibold">
                    {podiumTop3[1].tier}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-slate-500 text-xs font-mono truncate max-w-[150px]">
                    {podiumTop3[1].club}
                  </span>
                </div>

                {/* Metric Box */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex justify-around items-center mb-3">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-lg text-slate-800 font-bold">
                      {podiumTop3[1].eloRating.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">ELO RATING</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-lg text-slate-800 font-bold">
                      {podiumTop3[1].winRate}%
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      WINRATE ({podiumTop3[1].wins}/{podiumTop3[1].wins + podiumTop3[1].losses})
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-slate-500 text-xs font-mono px-1">
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <ArrowUp size={13} className="mr-0.5" />
                    +{podiumTop3[1].dailyDelta} tuần này
                  </span>
                  <span className="text-slate-700 font-bold">{podiumTop3[1].streak}</span>
                </div>
              </div>

              {/* Stage Pedestal 2 */}
              <div className="w-full h-12 bg-slate-200/80 border-x border-b border-slate-300/80 rounded-b-xl flex items-center justify-center">
                <span className="font-mono text-xs text-slate-600 font-bold tracking-widest uppercase">
                  RANK #02 // SILVER TIER
                </span>
              </div>
            </div>

            {/* RANK 1: Center Crown Gold Stage (Đặng Đình Khang) */}
            <div className="order-1 md:order-2 flex flex-col items-center -mt-6">
              <div
                onClick={() =>
                  setSelectedPlayerModal({
                    player: {
                      id: podiumTop3[0].id,
                      displayName: podiumTop3[0].displayName,
                      avatarUrl: podiumTop3[0].avatarUrl,
                      tierName: podiumTop3[0].tier,
                      eloRating: podiumTop3[0].eloRating,
                      confirmedMatchesCount: podiumTop3[0].wins + podiumTop3[0].losses,
                    } as unknown as PlayerProfile,
                    rank: 1,
                  })
                }
                className="w-full bg-white border-2 border-emerald-500 rounded-2xl p-5 flex flex-col items-center text-center relative shadow-lg group cursor-pointer"
              >
                {/* Gold Crown */}
                <div className="absolute -top-10 flex flex-col items-center">
                  <Trophy size={32} className="text-amber-500 drop-shadow-md animate-bounce" />
                  <div className="w-13 h-13 rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100 flex items-center justify-center font-mono text-lg font-black -mt-1">
                    1
                  </div>
                </div>

                <div className="relative mt-8 mb-3">
                  <img
                    src={podiumTop3[0].avatarUrl}
                    alt={podiumTop3[0].displayName}
                    className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-emerald-200"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow ring-2 ring-white">
                    <Medal size={16} />
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h2 className="text-xl text-slate-900 font-extrabold">{podiumTop3[0].displayName}</h2>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                    {podiumTop3[0].tier}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-slate-500 font-mono text-xs">{podiumTop3[0].club}</span>
                </div>

                {/* Champion Special Banner */}
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg py-1 px-3 mb-3 flex items-center justify-center gap-1 text-amber-800 font-mono text-xs">
                  <Flame size={15} className="text-amber-600 shrink-0" />
                  <span className="font-bold uppercase tracking-wider">{podiumTop3[0].streak}</span>
                </div>

                {/* Grand Metric Grid */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-around items-center mb-3">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl text-emerald-700 font-black">
                      {podiumTop3[0].eloRating.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">
                      ELO ĐỈNH CAO
                    </span>
                  </div>
                  <div className="h-9 w-px bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-2xl text-slate-900 font-bold">
                      {podiumTop3[0].winRate}%
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">
                      WINRATE ({podiumTop3[0].wins}/{podiumTop3[0].wins + podiumTop3[0].losses})
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-slate-600 text-xs font-mono px-1">
                  <span className="flex items-center text-emerald-700 font-bold">
                    <TrendingUp size={14} className="mr-1" />
                    #1 Vững ngôi 8 tuần
                  </span>
                  <span className="text-slate-800 font-semibold">MVP Mùa 4</span>
                </div>
              </div>

              {/* Stage Pedestal 1 */}
              <div className="w-full h-20 bg-emerald-600 rounded-b-xl flex flex-col items-center justify-center shadow-md">
                <span className="text-xs text-white font-black tracking-widest uppercase">
                  VÔ ĐỊCH BẢNG ĐẤU
                </span>
                <span className="font-mono text-[10px] text-emerald-100">SEASON 4 APEX LEADER</span>
              </div>
            </div>

            {/* RANK 3: Bronze Stage (Lê Minh Tuấn) */}
            <div className="order-3 md:order-3 flex flex-col items-center">
              <div
                onClick={() =>
                  setSelectedPlayerModal({
                    player: {
                      id: podiumTop3[2].id,
                      displayName: podiumTop3[2].displayName,
                      avatarUrl: podiumTop3[2].avatarUrl,
                      tierName: podiumTop3[2].tier,
                      eloRating: podiumTop3[2].eloRating,
                      confirmedMatchesCount: podiumTop3[2].wins + podiumTop3[2].losses,
                    } as unknown as PlayerProfile,
                    rank: 3,
                  })
                }
                className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-xs group hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              >
                <div className="absolute -top-6 w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 shadow-md flex items-center justify-center font-mono text-base text-amber-800 font-bold">
                  3
                </div>

                <div className="relative mt-4 mb-3">
                  <img
                    src={podiumTop3[2].avatarUrl}
                    alt={podiumTop3[2].displayName}
                    className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-amber-50"
                  />
                  <span className="absolute bottom-0 right-0 bg-white p-1 rounded-full text-emerald-600 shadow ring-1 ring-slate-200">
                    <CheckCircle2 size={15} />
                  </span>
                </div>

                <h3 className="text-base text-slate-900 font-bold mb-1">
                  {podiumTop3[2].displayName}
                </h3>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono uppercase font-semibold">
                    {podiumTop3[2].tier}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-slate-500 text-xs font-mono truncate max-w-[150px]">
                    {podiumTop3[2].club}
                  </span>
                </div>

                {/* Metric Box */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex justify-around items-center mb-3">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-lg text-slate-800 font-bold">
                      {podiumTop3[2].eloRating.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">ELO RATING</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-lg text-slate-800 font-bold">
                      {podiumTop3[2].winRate}%
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      WINRATE ({podiumTop3[2].wins}/{podiumTop3[2].wins + podiumTop3[2].losses})
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-slate-500 text-xs font-mono px-1">
                  <span className="flex items-center text-emerald-600 font-semibold">
                    <ArrowUp size={13} className="mr-0.5" />
                    +{podiumTop3[2].dailyDelta} tuần này
                  </span>
                  <span className="text-slate-700 font-bold">{podiumTop3[2].streak}</span>
                </div>
              </div>

              {/* Stage Pedestal 3 */}
              <div className="w-full h-8 bg-amber-100/70 border-x border-b border-amber-200 rounded-b-xl flex items-center justify-center">
                <span className="font-mono text-xs text-amber-800 font-bold tracking-widest uppercase">
                  RANK #03 // BRONZE TIER
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: Sticky Personal Placement Telemetry Banner                     */}
        {/* ========================================================================= */}
        <aside className="sticky top-20 z-30 w-full bg-white/95 backdrop-blur-xl border border-emerald-300 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ring-1 ring-emerald-200">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-mono text-base font-bold shadow-xs shrink-0">
              #{currentUserStanding.rank}
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={currentUserStanding.avatarUrl}
                  alt={currentUserStanding.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-400"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-900 font-bold truncate">
                    Vị trí của bạn: {currentUserStanding.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold shrink-0">
                    {currentUserStanding.tier}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs font-mono">
                  <span className="text-emerald-700 font-bold">{currentUserStanding.elo} Elo</span>
                  <span>•</span>
                  <span className="text-slate-700 font-medium">
                    Thắng {currentUserStanding.wins} / Bại {currentUserStanding.losses} ({currentUserStanding.winRate}% WR)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Gap & Milestone CTA */}
          <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 font-medium">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>
                  Mục tiêu Top 10: <strong className="text-emerald-700 font-bold">Cần +{currentUserStanding.targetGap} Elo</strong>
                </span>
              </div>
              <div className="w-44 bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentUserStanding.progressPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Swords size={16} />
              <span>Tìm Kèo Leo Rank</span>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* SECTION 4: Main Content Grid (8 cols Main + 4 cols Sidebar)               */}
        {/* ========================================================================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Leaderboard Table Stream (8 cols) */}
          <main className="lg:col-span-8 flex flex-col gap-4">
            {/* Search & Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900">
                <Trophy size={18} className="text-emerald-600" />
                <span className="text-sm font-bold">Bảng Xếp Hạng Tuyển Thủ</span>
                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                  Top 4 - 20
                </span>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-500 gap-2 w-full sm:w-64 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <Search size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên tuyển thủ, CLB..."
                  className="bg-transparent text-xs text-slate-900 focus:outline-none w-full placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Ladder Table Rows Container */}
            <div className="flex flex-col gap-1.5 bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-2xs">
              {/* Column Legend Bar */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-slate-500 font-mono text-[10px] uppercase tracking-wider bg-slate-100 rounded-xl font-bold">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-4">Tuyển thủ / Phân hạng</div>
                <div className="col-span-2 text-right">Elo Rating</div>
                <div className="col-span-2 text-center">Tỉ lệ Thắng</div>
                <div className="col-span-1 text-center">Phong độ</div>
                <div className="col-span-2 text-right">Tương tác</div>
              </div>

              {/* Rows */}
              {ladderList.map((player) => (
                <div
                  key={player.id}
                  className="group bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-150 p-3 sm:px-4 rounded-xl flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-2 items-center"
                >
                  {/* Rank & Delta */}
                  <div className="col-span-1 flex items-center justify-center gap-1 w-full sm:w-auto">
                    <span className="font-mono text-sm text-slate-900 font-bold">#{player.rank}</span>
                    {player.rankDelta > 0 ? (
                      <span className="flex items-center text-emerald-600 font-mono text-[10px] font-semibold">
                        <ArrowUp size={12} />
                        {player.rankDelta}
                      </span>
                    ) : player.rankDelta < 0 ? (
                      <span className="flex items-center text-rose-600 font-mono text-[10px] font-semibold">
                        <ArrowDown size={12} />
                        {Math.abs(player.rankDelta)}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono text-[10px]">
                        <Minus size={12} />
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-4 flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative shrink-0">
                      <img
                        src={player.avatarUrl}
                        alt={player.displayName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    </div>
                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-900 font-bold truncate">
                          {player.displayName}
                        </span>
                        {player.isVerified && (
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                        <span className="text-emerald-700 font-semibold">{player.tier}</span>
                        <span>•</span>
                        <span className="truncate">{player.club}</span>
                      </div>
                    </div>
                  </div>

                  {/* Elo Rating */}
                  <div className="col-span-2 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                    <span className="font-mono text-sm text-emerald-700 font-bold">
                      {player.eloRating.toLocaleString()}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-medium ${
                        player.dailyDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {player.dailyDelta >= 0 ? `+${player.dailyDelta}` : player.dailyDelta} Elo hnay
                    </span>
                  </div>

                  {/* Winrate */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <span className="font-mono text-xs text-slate-900 font-bold">{player.winRate}%</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {player.wins}W - {player.losses}L
                    </span>
                  </div>

                  {/* Form Dots */}
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    {player.form.map((res, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          res === 'W' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        title={res === 'W' ? 'Thắng' : 'Thua'}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => showToast(`Đã gửi lời mời thách đấu tới ${player.displayName}!`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg font-mono text-[11px] font-semibold transition-colors border border-slate-200"
                    >
                      Thách đấu
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPlayerModal({
                          player: {
                            id: player.id,
                            displayName: player.displayName,
                            avatarUrl: player.avatarUrl,
                            tierName: player.tier,
                            eloRating: player.eloRating,
                            confirmedMatchesCount: player.wins + player.losses,
                          } as unknown as PlayerProfile,
                          rank: player.rank,
                        })
                      }
                      title="Xem hồ sơ cá nhân"
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                      <UserCheck size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 pb-6 text-slate-600 text-xs">
              <span className="font-mono text-[11px]">
                Hiển thị {ladderList.length} trong tổng số 14,290 đấu thủ
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all shadow-2xs">
                  Trang trước
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
                  1
                </span>
                <button className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all shadow-2xs">
                  2
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all shadow-2xs">
                  3
                </button>
                <button className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all shadow-2xs">
                  Trang kế tiếp
                </button>
              </div>
            </div>
          </main>

          {/* Sidebar: Analytics, Climber & Fairplay (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            {/* Widget 1: MVP Climber of the Week (+180 Elo) */}
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Rocket size={18} className="text-emerald-600" />
                  <span className="text-sm text-slate-900 font-bold">Leo Rank Tuần Này</span>
                </div>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  MVP CLIMBER
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-3 relative">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiYZw7BDwGUuMJDH8MG-bNKXuYqhktmGbxhsOwmW3SZEnqFOG68kVmvBMG0zZ6RANxfL6Lr13fK2ecEKQDAqOMycRbL_r7Z5KXkG4qMi_Iu3ALGtQT--Tj9V8Zft5eFvg9T-iiLIaw27R0nA-oaMqmRIZmi1bZJu4XAAqK0lyCB5P8smmCOKv0k7YHSz3HGjYsRDvjrXdcTa21JzKdzoZngFIw_In1flQlXLmAtlqN"
                      alt="Đoàn Ngọc Sơn"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500"
                    />
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-black shadow">
                      ⚡
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <h4 className="text-sm text-slate-900 font-bold">Đoàn Ngọc Sơn</h4>
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">CLB Vợt Vàng Sài Gòn</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-sm text-emerald-700 font-extrabold">+180 Elo</span>
                      <span className="text-slate-500 font-mono text-[10px]">(7 ngày qua)</span>
                    </div>
                  </div>
                </div>

                {/* 3-stat Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-white border border-slate-200/80 rounded-lg p-2 font-mono">
                  <div>
                    <span className="text-xs text-slate-900 font-bold">12-0</span>
                    <span className="block text-[9px] text-slate-500 uppercase">BẤT BẠI</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-700 font-bold">2,110</span>
                    <span className="block text-[9px] text-slate-500 uppercase">ELO HIỆN TẠI</span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-700 font-bold">#18</span>
                    <span className="block text-[9px] text-slate-500 uppercase">TỪ HẠNG #45</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Đang tải hồ sơ trận đấu bứt phá của Đoàn Ngọc Sơn...')}
                  className="w-full mt-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-medium shadow-2xs"
                >
                  <TrendingUp size={14} className="text-emerald-700" />
                  <span>Xem lịch sử đấu bứt phá</span>
                </button>
              </div>
            </div>

            {/* Widget 2: Elo Distribution Community Curve (SVG Visualization) */}
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={18} className="text-emerald-600" />
                  <span className="text-sm text-slate-900 font-bold">Phân Phối Elo Cộng Đồng</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                  Mùa 4
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mô hình đường cong chuông chuẩn (Bell Curve) đại diện cho 14,290 vận động viên toàn hệ thống:
              </p>

              {/* Inline Telemetry SVG Curve */}
              <div className="w-full bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl flex flex-col items-center">
                <svg className="w-full h-32" fill="none" viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bellGradSport" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="1" x1="20" x2="300" y1="100" y2="100" />
                  <line stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="1" x1="20" x2="300" y1="60" y2="60" />
                  {/* Area fill */}
                  <path
                    d="M20 100 C 70 100, 100 80, 130 35 C 150 10, 170 10, 190 35 C 220 80, 250 100, 300 100 Z"
                    fill="url(#bellGradSport)"
                  />
                  {/* Curve Stroke */}
                  <path
                    d="M20 100 C 70 100, 100 80, 130 35 C 150 10, 170 10, 190 35 C 220 80, 250 100, 300 100"
                    stroke="#059669"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  {/* User Position Marker (Elo 2,140) */}
                  <line stroke="#059669" strokeDasharray="2 2" strokeWidth="1.5" x1="235" x2="235" y1="20" y2="100" />
                  <circle cx="235" cy="58" fill="#059669" r="4.5" />
                  <text fill="#047857" fontFamily="monospace" fontSize="9" fontWeight="700" x="195" y="16">
                    BẠN ({currentUserStanding.elo})
                  </text>
                  {/* Median Marker */}
                  <circle cx="160" cy="18" fill="#64748b" r="3" />
                  <text fill="#64748b" fontFamily="monospace" fontSize="8" fontWeight="600" x="135" y="112">
                    Median: 1,520
                  </text>
                </svg>

                {/* Tiers Legend */}
                <div className="w-full flex justify-between px-1 pt-2 text-[9px] font-mono text-slate-500 border-t border-slate-200">
                  <span>Bronze &lt;1200</span>
                  <span>Silver 1400</span>
                  <span>Gold 1700</span>
                  <span>Diamond 2000</span>
                  <span className="text-emerald-800 font-bold">Master 2300+</span>
                </div>
              </div>

              {/* Percentile Pill */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-slate-500">Phần Trăm Thứ Hạng Của Bạn</span>
                  <span className="font-mono text-sm text-emerald-700 font-bold">Top 0.8% Cao Nhất</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Medal size={18} />
                </div>
              </div>
            </div>

            {/* Widget 3: Fairplay & Anti-Cheat */}
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-slate-600 shadow-2xs">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-900 font-bold">Cơ chế Chống Gian Lận ELO v2.4</span>
                <p className="text-[11px] leading-relaxed mt-0.5 text-slate-600">
                  Tất cả các trận đấu từ mức Elo 2,000+ bắt buộc có xác nhận kết quả song phương và trọng tài sân hoặc clip VAR tự động.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Court Picker Sheet Modal */}
      {isCourtPickerOpen && (
        <CourtPickerSheet
          courts={courts}
          selectedCourtId={selectedCourtId}
          onSelectCourt={(cId) => {
            setSelectedCourtId(cId);
            setIsCourtPickerOpen(false);
          }}
          onClose={() => setIsCourtPickerOpen(false)}
        />
      )}

      {/* Player Detail Modal */}
      {selectedPlayerModal && (
        <PlayerDetailModal
          player={selectedPlayerModal.player}
          rank={selectedPlayerModal.rank}
          isCurrentUser={selectedPlayerModal.player.id === currentUserId}
          onClose={() => setSelectedPlayerModal(null)}
          onInvite={(name) => showToast(`Đã gửi tín hiệu giao lưu tới ${name}!`)}
        />
      )}
    </div>
  );
};
