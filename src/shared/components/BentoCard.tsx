import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  highlighted = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full border border-app-border rounded-bento p-5 text-app-text overflow-hidden transition-all ${
        highlighted ? 'bg-bento-highlight' : 'bg-app-surface'
      } ${
        onClick ? 'cursor-pointer hover:border-app-primary/50 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
