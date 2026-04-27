import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface-container-lowest/80 backdrop-blur-md rounded-xl border border-surface-variant shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
