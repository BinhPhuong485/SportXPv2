import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../core/config/supabase';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { OnboardingPage, OnboardingState } from './OnboardingPage';
import { BentoCard } from '../../shared/components/BentoCard';
import { PageContent } from '../../shared/components/PageContent';

interface OnboardingGateProps {
  children: React.ReactNode;
}

export const OnboardingGate: React.FC<OnboardingGateProps> = ({ children }) => {
  const { user, signOut } = useAuthStore();
  const isSkipOnboarding =
    typeof window !== 'undefined' &&
    window.location.href.includes('skipOnboarding=true');
  const [loading, setLoading] = useState(!isSkipOnboarding);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState | null>(() =>
    isSkipOnboarding
      ? {
          step: 5,
          answers: [1, 2, 1, 2, 1],
          displayName: 'Bạn',
          eloRating: 750,
          tierName: 'TB',
        }
      : null
  );

  const userId = user?.id;

  const loadOnboardingState = useCallback(async () => {
    if (isSkipOnboarding) {
      if (userId && supabase) {
        supabase.rpc('get_onboarding_state').then(() => {}, () => {});
      }
      setLoading(false);
      return;
    }
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    // Only show full-screen blocking loader on initial load (when state is null)
    // Never unmount existing UI on subsequent background checks or tab switches!
    if (!state) {
      setLoading(true);
    }
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_onboarding_state');
      if (rpcError) throw rpcError;

      const raw = data as {
        onboarding_step: number;
        answers: number[];
        display_name: string;
        elo_rating: number | null;
        tier_name: string | null;
      };

      // Query gender and age from profiles table or auth user metadata
      let gender: 'male' | 'female' | 'other' | null = (user?.user_metadata?.gender as any) || null;
      let age: number | null = user?.user_metadata?.age != null ? Number(user.user_metadata.age) : null;

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('gender, age')
          .eq('id', userId)
          .maybeSingle();
        if (prof) {
          if (prof.gender) gender = prof.gender as 'male' | 'female' | 'other';
          if (prof.age != null) age = Number(prof.age);
        }
      } catch {
        // non-blocking
      }

      setState({
        step: raw.onboarding_step,
        answers: raw.answers || [],
        displayName: raw.display_name,
        eloRating: raw.elo_rating,
        tierName: raw.tier_name,
        gender,
        age,
      });
    } catch {
      if (!state) {
        setError('Chưa tải được tiến độ của bạn. Kiểm tra kết nối và thử lại để tiếp tục.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isSkipOnboarding, user?.user_metadata]);

  useEffect(() => {
    loadOnboardingState();
  }, [loadOnboardingState]);

  const handleSaveDemographics = async (
    gender: 'male' | 'female' | 'other',
    age: number
  ): Promise<void> => {
    if (!supabase || !userId) throw new Error('Supabase client not available');
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;

    try {
      await supabase
        .from('profiles')
        .update({
          gender,
          age,
          birth_year: birthYear,
        })
        .eq('id', userId);
    } catch {
      // non-blocking
    }

    try {
      await supabase.auth.updateUser({
        data: {
          gender,
          age,
          birth_year: birthYear,
        },
      });
    } catch {
      // non-blocking
    }

    setState((prev) => (prev ? { ...prev, gender, age } : null));
  };

  const handleSaveAnswer = async (
    questionIndex: number,
    choiceIndex: number
  ): Promise<OnboardingState> => {
    if (!supabase) throw new Error('Supabase client not available');
    const { data, error: rpcError } = await supabase.rpc('save_onboarding_answer', {
      p_question_index: questionIndex,
      p_choice_index: choiceIndex,
    });
    if (rpcError) throw rpcError;

    const raw = data as {
      onboarding_step: number;
      answers: number[];
      display_name: string;
      elo_rating: number | null;
      tier_name: string | null;
    };

    const nextState: OnboardingState = {
      step: raw.onboarding_step,
      answers: raw.answers || [],
      displayName: raw.display_name,
      eloRating: raw.elo_rating,
      tierName: raw.tier_name,
      gender: state?.gender,
      age: state?.age,
    };
    setState(nextState);
    return nextState;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-app-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-app-muted">Đang tải hồ sơ…</span>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen w-full bg-app-background flex flex-col">
        <header className="w-full max-w-content mx-auto px-4 py-3.5 border-b border-app-border/40">
          <span className="text-base font-black tracking-widest text-app-text">SPORTXP</span>
        </header>
        <PageContent>
          <BentoCard>
            <p className="text-sm text-app-text leading-relaxed">
              {error || 'Chưa tải được tiến độ của bạn. Kiểm tra kết nối và thử lại để tiếp tục.'}
            </p>
          </BentoCard>
          <button
            onClick={loadOnboardingState}
            className="w-full h-12 rounded-xl bg-app-primary text-app-background font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-[0.99] transition-all"
          >
            THỬ LẠI
          </button>
          <button
            onClick={signOut}
            className="w-full py-2.5 text-center text-xs font-semibold text-app-muted hover:text-app-text transition-colors"
          >
            Đăng xuất
          </button>
        </PageContent>
      </div>
    );
  }

  if (state.step === 5) {
    return <>{children}</>;
  }

  return (
    <OnboardingPage
      initialState={state}
      onSaveAnswer={handleSaveAnswer}
      onSaveDemographics={handleSaveDemographics}
      onComplete={loadOnboardingState}
      onSignOut={signOut}
    />
  );
};
