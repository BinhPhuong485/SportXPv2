import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../core/config/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  session: initial.session,
  user: initial.user,
  loading: false,
  initialized: initial.initialized,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    }),
  signOut: async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    set({ session: null, user: null });
  },
}));

// Initialize listener once
if (supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
} else {
  useAuthStore.getState().setSession(null);
}
