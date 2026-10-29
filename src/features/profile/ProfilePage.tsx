import React, { useState, useEffect } from 'react';
import {
  Shield,
  Edit2,
  QrCode,
  Flame,
  Users,
  LogOut,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../core/config/supabase';

interface UserProfileData {
  displayName: string;
  eloRating: number | null;
  tierName: string | null;
  winStreak: number;
  trustScore: number;
}

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    displayName: user?.user_metadata?.display_name || 'Vận động viên',
    eloRating: 300,
    tierName: 'TB',
    winStreak: 0,
    trustScore: 100,
  });

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from('profiles')
      .select('display_name, elo_rating, tier_name, win_streak, trust_score')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            displayName: data.display_name || user.user_metadata?.display_name || 'Vận động viên',
            eloRating: data.elo_rating ?? 300,
            tierName: data.tier_name || 'TB',
            winStreak: data.win_streak ?? 0,
            trustScore: data.trust_score ?? 100,
          });
        }
      });
  }, [user]);

  const profileName = profile.displayName;
  const profileElo = profile.eloRating ?? 300;
  const profileTier = profile.tierName ?? 'TB';
  const profileLink = `${window.location.origin}/#/p/${user?.id || 'me'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    alert('Đã sao chép link hồ sơ.');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SportXP Profile',
          text: `Hồ sơ vận động viên ${profileName} trên SportXP`,
          url: profileLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Circular progress: circumference of r=72 is 2 * PI * 72 = 452.39
  const circumference = 452.39;
  const progressRatio = Math.min(Math.max((profileElo - 300) / 1200, 0.05), 1.0);
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <PageContent>
      {/* 1. ATHLETE IDENTITY HEADER CARD WITH CIRCULAR ELO METER */}
      <BentoCard highlighted>
        <div className="flex flex-col">
          {/* Header row: Avatar, Name, Edit */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[54px] h-[54px] rounded-full bg-app-mint text-app-primary flex items-center justify-center text-lg font-extrabold uppercase shrink-0">
                {profileName.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <h2 className="text-[22px] font-extrabold text-app-text leading-tight">
                  {profileName}
                </h2>
                <p className="text-xs text-app-muted mt-0.5">
                  Hồ sơ vận động viên
                </p>
              </div>
            </div>

            <button
              onClick={() => alert('Chỉnh sửa hồ sơ sẽ có trong Phase 5!')}
              className="p-2 text-app-muted hover:text-app-text rounded-full transition-colors"
              title="Chỉnh sửa hồ sơ"
            >
              <Edit2 size={20} />
            </button>
          </div>

          {/* Prominent 164x164 Circular Elo Meter matching Flutter */}
          <div className="relative w-[164px] h-[164px] mx-auto my-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 164 164">
              {/* Background ring */}
              <circle
                cx="82"
                cy="82"
                r="72"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-app-border"
              />
              {/* Progress ring */}
              <circle
                cx="82"
                cy="82"
                r="72"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-app-primary transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[40px] font-extrabold leading-none tracking-tight text-app-primary tabular-nums">
                {profileElo}
              </span>
              <span className="text-xs font-semibold text-app-muted mt-1.5">
                {profileTier}
              </span>
            </div>
          </div>

          {/* QR Passport CTA Button */}
          <button
            onClick={() => setIsQrOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-app-primary text-app-on-primary font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition-all shadow-xs"
          >
            <QrCode size={16} />
            <span>MỞ MÃ HỘ CHIẾU QR</span>
          </button>
        </div>
      </BentoCard>

      {/* 2. PERFORMANCE METRICS CARD (Chuỗi thắng & Điểm uy tín) */}
      <BentoCard>
        <div className="grid grid-cols-2 gap-4 divide-x divide-app-border/60">
          {/* Chuỗi thắng */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="flex items-center gap-1.5 text-xs text-app-muted mb-1 font-medium">
              <Flame size={16} className="text-app-streak" />
              <span>CHUỖI THẮNG</span>
            </div>
            <div className="text-[28px] font-extrabold tabular-nums text-app-streak leading-none">
              {profile.winStreak} <span className="text-sm font-semibold text-app-muted">trận</span>
            </div>
          </div>

          {/* Điểm uy tín */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="flex items-center gap-1.5 text-xs text-app-muted mb-1 font-medium">
              <Shield size={16} className="text-app-primary" />
              <span>ĐIỂM UY TÍN</span>
            </div>
            <div className="text-[28px] font-extrabold tabular-nums text-app-primary leading-none">
              {profile.trustScore}<span className="text-base font-semibold text-app-muted">/100</span>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* 3. QUICK ACTIONS & SOCIAL CONNECTIONS */}
      <BentoCard>
        <div className="flex flex-col divide-y divide-app-border/50">
          <button
            type="button"
            onClick={() => (window.location.hash = '#/connections')}
            className="py-3.5 flex items-center justify-between text-left hover:text-app-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-app-primary/10 text-app-primary">
                <Users size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-app-text">Bạn bè và lời mời</div>
                <div className="text-xs text-app-muted">Danh sách bạn bè và kết nối thi đấu</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-app-muted" />
          </button>

          <button
            type="button"
            onClick={() => (window.location.hash = '#/scan')}
            className="py-3.5 flex items-center justify-between text-left hover:text-app-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-app-primary/10 text-app-primary">
                <QrCode size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-app-text">Quét mã / Mở link hồ sơ</div>
                <div className="text-xs text-app-muted">Quét QR hoặc dán link hồ sơ đối thủ</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-app-muted" />
          </button>
        </div>
      </BentoCard>

      {/* 4. ACTION BUTTONS: CẬP NHẬT & ĐĂNG XUẤT */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 py-3 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-app-text text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        >
          <RefreshCw size={15} />
          <span>CẬP NHẬT</span>
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex-1 py-3 rounded-xl border border-app-border bg-app-surface text-app-loss hover:bg-app-loss/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
        >
          <LogOut size={15} />
          <span>ĐĂNG XUẤT</span>
        </button>
      </div>

      {/* QR Passport Modal Sheet */}
      <ModalSheet
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title="MÃ HỘ CHIẾU CỦA TÔI"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <h3 className="text-xl font-extrabold text-app-text">{profileName}</h3>
          <p className="text-xs text-app-muted -mt-2">
            {profileElo} ELO · {profileTier}
          </p>

          <div className="p-4 bg-white rounded-2xl shadow-lg my-1">
            <QRCodeSVG value={profileLink} size={200} />
          </div>

          <p className="text-xs text-app-muted leading-relaxed">
            Quét để xem hồ sơ và gửi lời mời.<br />Chỉ kết bạn khi cả hai đồng ý.
          </p>

          <div className="w-full p-2.5 rounded-lg bg-app-background border border-app-border text-xs text-app-muted truncate select-all">
            {profileLink}
          </div>

          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              onClick={handleShare}
              className="w-full py-3 rounded-xl bg-app-primary text-app-on-primary font-extrabold text-xs tracking-wider uppercase hover:brightness-105 transition-all"
            >
              CHIA SẺ LINK HỒ SƠ
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl border border-app-border text-app-muted hover:text-app-text text-xs font-semibold transition-all"
            >
              SAO CHÉP LINK
            </button>
          </div>
        </div>
      </ModalSheet>
    </PageContent>
  );
};
