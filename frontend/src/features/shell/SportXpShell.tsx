import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopAppBar } from '../../shared/components/TopAppBar';
import { BottomNav } from '../../shared/components/BottomNav';

export const SportXpShell: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased selection:bg-app-mint selection:text-app-primary">
      {/* 1. Full-Width Top Application Bar */}
      <TopAppBar />

      {/* 2. Main Responsive Content Area */}
      <main className="w-full flex-1 flex justify-center px-3 sm:px-4 lg:px-6 py-4 sm:py-5 pb-28 xl:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Visible on mobile & tablet devices < 1280px, with prominent center 'Tạo kèo' button) */}
      <div className="xl:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
