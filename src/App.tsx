import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from './features/auth/AuthGate';
import { OnboardingGate } from './features/onboarding/OnboardingGate';
import { AuthPage } from './features/auth/AuthPage';
import { SportXpShell } from './features/shell/SportXpShell';
import { ManagedRoomsPage } from './features/rooms/ManagedRoomsPage';
import { LeaderboardPage } from './features/rankings/LeaderboardPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { SocialProfilePage } from './features/social/SocialProfilePage';
import { ConnectionsPage } from './features/social/ConnectionsPage';
import { ScanProfilePage } from './features/social/ScanProfilePage';
import { RoomDetailPage } from './features/rooms/RoomDetailPage';
import { RoomEditorPage } from './features/rooms/RoomEditorPage';
import { RoomSessionPage } from './features/rooms/RoomSessionPage';
import { TournamentsPage } from './features/tournaments/TournamentsPage';

import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { SplashScreen } from './features/splash/SplashScreen';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Screen */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/splash" element={<SplashScreen onComplete={() => {}} />} />
      <Route
        path="/onboarding"
        element={
          <OnboardingPage
            initialState={{
              step: 0,
              answers: [],
              displayName: 'Bạn',
              eloRating: 750,
              tierName: 'TB',
            }}
            onSaveAnswer={async (_q, _c) => ({
              step: 0,
              answers: [],
              displayName: 'Bạn',
              eloRating: 750,
              tierName: 'TB',
            })}
            onComplete={() => {}}
            onSignOut={() => {}}
          />
        }
      />

      {/* Protected Routes wrapped in AuthGate and OnboardingGate */}
      <Route
        element={
          <AuthGate>
            <OnboardingGate>
              <SportXpShell />
            </OnboardingGate>
          </AuthGate>
        }
      >
        <Route path="/" element={<ManagedRoomsPage />} />
        <Route path="/rooms" element={<ManagedRoomsPage />} />
        <Route path="/rankings" element={<LeaderboardPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Standalone Protected Sub-pages */}
      <Route
        path="/p/:id"
        element={
          <AuthGate>
            <OnboardingGate>
              <SocialProfilePage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/connections"
        element={
          <AuthGate>
            <OnboardingGate>
              <ConnectionsPage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/scan"
        element={
          <AuthGate>
            <OnboardingGate>
              <ScanProfilePage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/rooms/new"
        element={
          <AuthGate>
            <OnboardingGate>
              <RoomEditorPage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/rooms/:roomId"
        element={
          <AuthGate>
            <OnboardingGate>
              <RoomDetailPage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/rooms/:roomId/edit"
        element={
          <AuthGate>
            <OnboardingGate>
              <RoomEditorPage />
            </OnboardingGate>
          </AuthGate>
        }
      />
      <Route
        path="/rooms/:roomId/session"
        element={
          <AuthGate>
            <OnboardingGate>
              <RoomSessionPage />
            </OnboardingGate>
          </AuthGate>
        }
      />

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

