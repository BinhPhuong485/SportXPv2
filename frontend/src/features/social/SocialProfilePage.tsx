import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  Flame,
  UserPlus,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../core/config/supabase';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';
import { rankTierFromElo } from '../rankings/domain/rankTier';

interface VisitedProfile {
  id: string;
  publicId?: string;
  displayName: string;
  avatarUrl?: string | null;
  eloRating?: number | null;
  tierName?: string | null;
  trustScore: number;
  winStreak: number;
  homeCourtName?: string | null;
  district?: string | null;
  city?: string | null;
  zaloPhone?: string | null;
  zaloLink?: string | null;
  facebookLink?: string | null;
  bio?: string | null;
}

export const SocialProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VisitedProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'pending' | 'accepted' | 'is_self'
  >('none');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !supabase) return;
    const client = supabase;

    let isMounted = true;
    setLoading(true);

    const fetchTargetProfile = async () => {
      try {
        // Query by id or public_id
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
        let query = client
          .from('profiles')
          .select(
            'id, public_id, display_name, avatar_url, elo_rating, tier_name, trust_score, win_streak, home_court_id, district, city, zalo_phone, zalo_link, facebook_link, bio, courts(name)'
          );

        if (isUuid) {
          query = query.or(`id.eq.${id},public_id.eq.${id}`);
        } else {
          query = query.eq('public_id', id);
        }

        const { data, error } = await query.maybeSingle();
        if (error || !data) {
          if (isMounted) setLoading(false);
          return;
        }

        const rawCourt = Array.isArray(data.courts) ? data.courts[0] : data.courts;
        const court = rawCourt as { name: string } | null;

        const target: VisitedProfile = {
          id: data.id,
          publicId: data.public_id,
          displayName: data.display_name || 'Vận động viên',
          avatarUrl: data.avatar_url,
          eloRating: data.elo_rating ?? 750,
          tierName: data.tier_name || 'Nhập môn',
          trustScore: data.trust_score ?? 100,
          winStreak: data.win_streak ?? 0,
          homeCourtName: court?.name || null,
          district: data.district,
          city: data.city || 'TP. Hồ Chí Minh',
          zaloPhone: data.zalo_phone,
          zaloLink: data.zalo_link,
          facebookLink: data.facebook_link,
          bio: data.bio,
        };

        if (isMounted) {
          setProfile(target);

          // Check friendship relation with current user
          if (user && user.id === target.id) {
            setFriendshipStatus('is_self');
          } else if (user) {
            const uLow = user.id < target.id ? user.id : target.id;
            const uHigh = user.id < target.id ? target.id : user.id;

            const { data: fr } = await client
              .from('friendships')
              .select('status')
              .eq('user_low', uLow)
              .eq('user_high', uHigh)
              .maybeSingle();

            if (fr?.status === 'accepted') {
              setFriendshipStatus('accepted');
            } else if (fr?.status === 'pending') {
              setFriendshipStatus('pending');
            } else {
              setFriendshipStatus('none');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching target profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTargetProfile();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleSendFriendRequest = async () => {
    if (!user || !profile || !supabase) return;
    const client = supabase;
    setActionLoading(true);
    try {
      const uLow = user.id < profile.id ? user.id : profile.id;
      const uHigh = user.id < profile.id ? profile.id : user.id;

      const { error } = await client.from('friendships').upsert({
        user_low: uLow,
        user_high: uHigh,
        requested_by: user.id,
        status: 'pending',
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setFriendshipStatus('pending');
      setToastMessage('Đã gửi lời mời kết nối!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Không thể gửi lời mời kết nối lúc này.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const elo = profile?.eloRating ?? 750;
  const tier = rankTierFromElo(elo);

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased select-none">
      {/* Top Header */}
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border/40 bg-app-surface/90 sticky top-0 z-40 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>HỘ CHIẾU CẦU LÔNG</span>
        </button>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-app-surface text-app-text border border-app-border shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      <PageContent>
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-app-muted text-xs">
            <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
            <span>Đang tra cứu hộ chiếu vận động viên...</span>
          </div>
        ) : !profile ? (
          <BentoCard className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle size={36} className="text-amber-500" />
            <h3 className="text-base font-bold text-app-text">Không tìm thấy vận động viên</h3>
            <p className="text-xs text-app-muted max-w-sm">
              Mã hồ sơ hoặc đường link quét không tồn tại hoặc đã bị xóa khỏi hệ thống.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-bold"
            >
              Về Trang chủ
            </button>
          </BentoCard>
        ) : (
          <div className="flex flex-col gap-5 max-w-xl mx-auto w-full">
            {/* Identity Card */}
            <BentoCard highlighted className="relative overflow-hidden p-6 flex flex-col gap-5">
              {/* Header profile info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-app-mint text-app-primary border-2 border-app-primary flex items-center justify-center text-xl font-black shrink-0 shadow-md">
                  {getInitials(profile.displayName)}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-app-text truncate">
                      {profile.displayName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-app-primary/10 text-app-primary shrink-0">
                      {tier.label}
                    </span>
                  </div>
                  <span className="text-xs text-app-muted mt-0.5">
                    Hạng trình: {tier.group} · ID: {profile.publicId?.substring(0, 8) || '—'}
                  </span>
                </div>
              </div>

              {/* Bio if exists */}
              {profile.bio && (
                <div className="p-3 rounded-xl bg-app-background/80 border border-app-border/60 text-xs text-app-text italic">
                  "{profile.bio}"
                </div>
              )}

              {/* Stats 3 columns */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col items-center">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                    ĐIỂM ELO
                  </span>
                  <div className="text-xl font-black text-app-primary mt-0.5 tabular-nums">
                    {elo}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col items-center">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                    CHUỖI THẮNG
                  </span>
                  <div className="text-xl font-black text-app-streak mt-0.5 tabular-nums flex items-center gap-1">
                    <Flame size={16} />
                    <span>{profile.winStreak}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col items-center">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
                    UY TÍN
                  </span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                    {profile.trustScore}%
                  </div>
                </div>
              </div>

              {/* Location info */}
              {(profile.homeCourtName || profile.district) && (
                <div className="p-3 rounded-xl bg-app-background border border-app-border flex items-center gap-2.5">
                  <MapPin size={16} className="text-app-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-app-text truncate">
                      {profile.homeCourtName || 'Sân tự do'}
                    </span>
                    <span className="text-[11px] text-app-muted truncate">
                      {[profile.district, profile.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Direct Contact Channels (Zalo / Facebook) */}
              {(profile.zaloLink || profile.zaloPhone || profile.facebookLink) && (
                <div className="flex flex-col gap-2 pt-2 border-t border-app-border/40">
                  <span className="text-xs font-bold text-app-muted uppercase tracking-wider">
                    Kênh liên hệ trực tiếp
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(profile.zaloLink || profile.zaloPhone) && (
                      <a
                        href={
                          profile.zaloLink
                            ? profile.zaloLink
                            : `https://zalo.me/${profile.zaloPhone?.replace(/[^0-9]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold flex items-center gap-2 border border-blue-500/20 transition-all shadow-xs"
                      >
                        <MessageCircle size={15} />
                        <span>Chat Zalo</span>
                        <ExternalLink size={12} />
                      </a>
                    )}

                    {profile.facebookLink && (
                      <a
                        href={profile.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold flex items-center gap-2 border border-indigo-500/20 transition-all shadow-xs"
                      >
                        <ExternalLink size={15} />
                        <span>Facebook Profile</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Friendship / Action Button */}
              {friendshipStatus === 'is_self' ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="w-full py-3 rounded-xl bg-app-surface border border-app-border text-app-text font-black text-xs tracking-wider uppercase hover:border-app-primary/50 transition-all shadow-xs"
                >
                  ĐÂY LÀ HỒ SƠ CỦA BẠN (CHỈNH SỬA)
                </button>
              ) : friendshipStatus === 'accepted' ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2">
                  <Check size={16} />
                  <span>ĐÃ KẾT BẠN</span>
                </div>
              ) : friendshipStatus === 'pending' ? (
                <div className="w-full py-3 rounded-xl bg-app-surface border border-app-border text-app-muted font-bold text-xs tracking-wider uppercase text-center">
                  ĐÃ GỬI LỜI MỜI KẾT NỐI (CHỜ XÁC NHẬN)
                </div>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSendFriendRequest}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>{actionLoading ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU KẾT NỐI'}</span>
                </button>
              )}
            </BentoCard>
          </div>
        )}
      </PageContent>
    </div>
  );
};
