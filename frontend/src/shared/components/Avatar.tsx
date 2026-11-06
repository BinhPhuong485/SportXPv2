import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (src && !hasError) {
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 select-none bg-slate-100 dark:bg-slate-800 ${sizeClass} ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // High-taste default silhouette avatar graphic (clean athletic / professional user silhouette)
  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 select-none flex items-center justify-center bg-slate-200 dark:bg-slate-700/80 border border-slate-300/60 dark:border-slate-600/60 ${sizeClass} ${className}`}
      title={alt}
    >
      <svg
        className="w-[62%] h-[62%] text-slate-400 dark:text-slate-400 translate-y-[8%]"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {/* Head */}
        <path d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3 7.5 5.015 7.5 7.5 9.515 12 12 12z" />
        {/* Torso / Shoulders with rounded contour */}
        <path d="M12 14.25c-4.418 0-8 2.35-8 5.25 0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5 0-2.9-3.582-5.25-8-5.25z" />
      </svg>
    </div>
  );
};

