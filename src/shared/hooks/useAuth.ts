import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../core/config/supabase';
import { PlayerProfile } from '../../features/profile/domain/playerProfile';
import { profileRepository } from '../../features/profile/data/profileRepository';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: PlayerProfile | null;
  loading: boolean;
  initialized: boolean;
  profileLoading: boolean;
  setSession: (session: Session | null) => void;
  loadProfile: () => Promise<PlayerProfile | null>;
  updateProfile: (params: { displayName?: string; homeCourtId?: string | null }) => Promise<void>;
  signOut: () => Promise<void>;
}

const getInitialSession = (): { session: Session | null; user: User | null; initialized: boolean } => {
  try {
    const urlMatch = window.location.href.match(/[?&]session=([^&]+)/);
    if (urlMatch) {
      const decoded = decodeURIComponent(urlMatch[1]);
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.user) {
        localStorage.setItem('sb-yjcqaxszvmpnlmypxjqq-auth-token', JSON.stringify(parsed));
        return { session: parsed as Session, user: parsed.user as User, initialized: true };
      }
    }
    const raw = localStorage.getItem('sb-yjcqaxszvmpnlmypxjqq-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user) {
        return { session: parsed as Session, user: parsed.user as User, initialized: true };
      }
    }
  } catch {
    // fallback
  }
  return { session: null, user: null, initialized: false };
};

const initial = getInitialSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  session: initial.session,
  user: initial.user,
  profile: null,
  loading: false,
  initialized: initial.initialized,
  profileLoading: false,
  setSession: (session) => {
    const prevUser = get().user;
    const nextUser = session?.user ?? null;
    set({
      session,
      user: nextUser,
      loading: false,
      initialized: true,
    });
    if (nextUser && nextUser.id !== prevUser?.id) {
      get().loadProfile();
    } else if (!nextUser) {
      set({ profile: null });
    }
  },
  loadProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null, profileLoading: false });
      return null;
    }
    set({ profileLoading: true });
    try {
      const p = await profileRepository.currentProfile();
      set({ profile: p, profileLoading: false });
      return p;
    } catch (err) {
      console.error('Failed to load profile:', err);
      set({ profileLoading: false });
      return null;
    }
  },
  updateProfile: async (params) => {
    // Single source of truth update:
    // 1. Send update to Supabase server
    await profileRepository.updateProfile(params);
    // 2. Refetch full profile from server to guarantee authoritative state
    const freshProfile = await get().loadProfile();
    if (!freshProfile) {
      throw new Error('Đã lưu nhưng không thể tải lại hồ sơ từ máy chủ.');
    }
  },
  signOut: async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    set({ session: null, user: null, profile: null });
  },
}));

// Initialize listener once
if (supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
    if (session?.user) {
      useAuthStore.getState().loadProfile();
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    if (session?.user) {
      useAuthStore.getState().loadProfile();
    }
  });
} else {
  useAuthStore.getState().setSession(null);
}
