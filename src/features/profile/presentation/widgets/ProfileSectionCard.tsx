import React from 'react';
import { BentoCard } from '../../../../shared/components/BentoCard';

export interface ProfileSectionCardProps {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({
  id,
  icon,
  title,
  subtitle,
  action,
  children,
  className = '',
  contentClassName = '',
}) => {
  return (
    <div id={id} className={`w-full ${className}`}>
      <BentoCard doubleBezel className="flex flex-col">
        {/* Standardized Header */}
        <div className="flex items-center justify-between pb-2 mb-3.5 border-b border-app-border/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-app-primary/10 border border-app-primary/25 flex items-center justify-center text-app-primary shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-app-text truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-app-muted font-medium truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0 ml-2">{action}</div>}
        </div>

        {/* Standardized Content Container */}
        <div className={`flex flex-col gap-3 ${contentClassName}`}>
          {children}
        </div>
      </BentoCard>
    </div>
  );
};
