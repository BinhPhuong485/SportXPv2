import React, { useState } from 'react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { SplashScreen } from '../splash/SplashScreen';
import { AuthPage } from './AuthPage';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, initialized } = useAuthStore();
  const isBypassSplash =
    typeof window !== 'undefined' &&
    (window.location.search.includes('noSplash=true') ||
      window.location.hash.includes('noSplash=true'));

  const [splashCompleted, setSplashCompleted] = useState(isBypassSplash);

  // Show Splash first upon app boot
  if (!splashCompleted) {
    return <SplashScreen onComplete={() => setSplashCompleted(true)} />;
  }

  // Once splash is completed, if not initialized or not signed in, show AuthPage
  if (!initialized || !user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
