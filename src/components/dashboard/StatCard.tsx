import React from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, className = '' }) => {
  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-surface-variant p-lg flex flex-col gap-sm ${className}`}>
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {trend && (
          <span className={`font-label-md text-label-md ${trend.positive ? 'text-primary' : 'text-error'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-display text-on-surface">{value}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
