import React from 'react';
import { useAuthStore } from '../../shared/hooks/useAuth';
import { AuthPage } from './AuthPage';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, initialized } = useAuthStore();

  // If auth state is still resolving, show clean background with minimal loader
  if (!initialized) {
    return (
      <div className="min-h-screen w-full bg-app-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in -> show AuthPage
  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
