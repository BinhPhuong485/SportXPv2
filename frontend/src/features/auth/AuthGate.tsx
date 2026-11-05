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
      window.location.hash.includes('noSplash=true') ||
      sessionStorage.getItem('sportxp_splash_seen') === 'true');

  const [splashCompleted, setSplashCompleted] = useState(isBypassSplash);

  const handleSplashComplete = () => {
    try {
      sessionStorage.setItem('sportxp_splash_seen', 'true');
    } catch {
      // ignore
    }
    setSplashCompleted(true);
  };

  // Show Splash first upon app boot (only once per browser tab session)
  if (!splashCompleted) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Once splash is completed, if not initialized or not signed in, show AuthPage
  if (!initialized || !user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
