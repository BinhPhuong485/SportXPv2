import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 1800,
}) => {
  const isNoExit =
    typeof window !== 'undefined' && window.location.href.includes('noExit=true');
  const effectiveDuration = isNoExit ? 999999 : duration;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let frameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const nextProgress = Math.min(elapsed / effectiveDuration, 1);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [effectiveDuration, onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center bg-app-court-dark cursor-pointer select-none overflow-hidden"
    >
      {/* Ambient Court Glow Effect */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgb(var(--color-accent)) 0%, rgb(var(--color-primary)) 50%, transparent 70%)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in px-4">
        {/* Squircle 3D Master Brand Icon */}
        <div className="relative w-28 h-28 mb-6 rounded-[26px] p-0.5 border border-white/30 shadow-[0_12px_36px_rgba(41,154,99,0.45),0_-4px_20px_rgba(245,158,11,0.25)] overflow-hidden transition-transform duration-500 hover:scale-105">
          <img
            src="/assets/brand/app_icon_master.png"
            alt="SportXP Logo"
            className="w-full h-full object-cover rounded-[24px]"
            onError={(e) => {
              // Fallback to symbol if master icon fails
              (e.currentTarget as HTMLImageElement).src = '/assets/brand/symbol.png';
            }}
          />
        </div>

        {/* SPORTXP Brand Title */}
        <h1
          className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white mb-2"
          style={{
            textShadow: '0 2px 20px rgba(41, 154, 99, 0.7)',
          }}
        >
          SPORTXP
        </h1>

        {/* Official Slogan */}
        <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-[0.18em] text-app-mint uppercase mb-8 shadow-sm">
          MỖI SET CẦU • MỘT BƯỚC TIẾN
        </div>

        {/* Kinetic Loading Bar */}
        <div className="w-[150px] h-[3px] bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-app-accent via-app-primary to-app-gold transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Tap to skip bottom caption */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-bold tracking-[0.22em] text-app-muted uppercase opacity-90">
        CHẠM ĐỂ BẮT ĐẦU
      </div>
    </div>
  );
};
