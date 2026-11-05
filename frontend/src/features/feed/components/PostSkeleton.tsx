import React from 'react';

export const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-app-surface rounded-xl p-3.5 sm:p-4 border border-app-border/80 flex flex-col gap-3 shadow-2xs overflow-hidden animate-pulse">
      {/* 1. Author Header Skeleton */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-app-border shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 w-32 rounded-md bg-slate-200 dark:bg-app-border" />
            <div className="h-2.5 w-44 rounded-md bg-slate-100 dark:bg-app-border/60" />
            <div className="h-2 w-20 rounded-md bg-slate-100 dark:bg-app-border/40" />
          </div>
        </div>
        <div className="h-6.5 w-18 rounded-full bg-slate-100 dark:bg-app-border/60 shrink-0 hidden sm:block" />
      </div>

      {/* 2. Text Content Lines Skeleton */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="h-3 w-full rounded bg-slate-200 dark:bg-app-border" />
        <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-app-border" />
        <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-app-border/60" />
      </div>

      {/* 3. Media / Match Recap Box Skeleton */}
      <div className="h-28 w-full rounded-lg bg-slate-100 dark:bg-app-border/40 border border-slate-200/60 dark:border-app-border/50" />

      {/* 4. Reaction Counter Skeleton */}
      <div className="flex items-center justify-between pt-1 border-b border-app-border/40 pb-2">
        <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-app-border/50" />
        <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-app-border/50" />
      </div>

      {/* 5. 4 Action Buttons Skeleton */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="h-7 rounded-lg bg-slate-100 dark:bg-app-border/40" />
        <div className="h-7 rounded-lg bg-slate-100 dark:bg-app-border/40" />
        <div className="h-7 rounded-lg bg-slate-100 dark:bg-app-border/40" />
        <div className="h-7 rounded-lg bg-slate-100 dark:bg-app-border/40" />
      </div>
    </div>
  );
};

