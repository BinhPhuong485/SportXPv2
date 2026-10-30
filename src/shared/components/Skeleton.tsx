import React from 'react';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle = false }) => {
  return (
    <div
      className={`animate-pulse bg-app-border/60 ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
    />
  );
};

