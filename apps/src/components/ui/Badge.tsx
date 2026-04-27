import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-surface-container text-on-surface-variant',
  success: 'bg-primary-container text-on-primary-container',
  warning: 'bg-tertiary-container text-on-tertiary-container',
  error: 'bg-error-container text-on-error-container',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-md text-label-md ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
