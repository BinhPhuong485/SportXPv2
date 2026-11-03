import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'hosting'
  | 'joined'
  | 'tournament'
  | 'cancelled';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-app-primary/15 text-app-primary border-app-primary/25',
    secondary: 'bg-app-mint text-app-primary border-app-primary/30',
    success: 'bg-app-primary/15 text-app-primary border-app-primary/25',
    warning: 'bg-app-streak/15 text-app-streak border-app-streak/30',
    danger: 'bg-app-loss/15 text-app-loss border-app-loss/30',
    neutral: 'bg-app-surface text-app-muted border-app-border',
    hosting: 'bg-app-event-hosting/15 text-app-event-hosting border-app-event-hosting/30',
    joined: 'bg-app-event-joined/15 text-app-event-joined border-app-event-joined/30',
    tournament: 'bg-app-event-tournament/15 text-app-event-tournament border-app-event-tournament/30',
    cancelled: 'bg-app-event-cancelled/15 text-app-event-cancelled border-app-event-cancelled/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-badge text-[10px] font-black tracking-wider uppercase border ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

