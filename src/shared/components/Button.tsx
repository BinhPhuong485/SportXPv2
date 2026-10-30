import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide rounded-btn transition-all select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden';

  const sizeStyles = {
    sm: 'min-h-[38px] px-3.5 py-1.5 text-xs',
    md: 'min-h-touch px-5 py-2.5 text-xs uppercase tracking-wider',
    lg: 'min-h-[52px] px-6 py-3 text-sm uppercase tracking-wider',
  };

  const variantStyles = {
    primary:
      'bg-app-primary text-app-on-primary hover:brightness-105 active:brightness-95 shadow-xs border border-app-primary/20',
    secondary:
      'bg-app-mint text-app-primary hover:brightness-95 active:brightness-90 border border-app-primary/25',
    outline:
      'bg-app-surface text-app-text border border-app-border hover:border-app-primary/60 hover:text-app-primary active:bg-app-background',
    danger:
      'bg-app-loss text-white hover:brightness-105 active:brightness-95 shadow-xs border border-app-loss/20',
    ghost:
      'bg-transparent text-app-muted hover:text-app-text hover:bg-app-surface active:bg-app-background',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" />
      ) : icon ? (
        <span className="shrink-0 mr-2 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

