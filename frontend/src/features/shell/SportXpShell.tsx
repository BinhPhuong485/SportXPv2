import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TopAppBar } from '../../shared/components/TopAppBar';
import { BottomNav } from '../../shared/components/BottomNav';

export const SportXpShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isRoomsTab = location.pathname === '/rooms';

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased selection:bg-app-mint selection:text-app-primary">
      {/* 1. Full-Width LinkedIn-Style Top Application Bar */}
      <TopAppBar />

      {/* 2. Main Responsive Content Area */}
      <main className="w-full flex-1 flex justify-center px-3 sm:px-4 lg:px-6 py-4 sm:py-5 pb-28 xl:pb-8">
        <Outlet />
      </main>

      {/* Floating Action Button for Rooms Tab (Mobile only, on tablet/desktop header has CTA button) */}
      {isRoomsTab && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-30 animate-fade-in md:hidden">
          <button
            type="button"
            onClick={() => navigate('/rooms/new')}
            className="flex items-center gap-2 h-14 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>TẠO KÈO MỚI</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar (Visible on mobile & all tablet/iPad devices < 1280px, hidden on desktop >= 1280px) */}
      <div className="xl:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
