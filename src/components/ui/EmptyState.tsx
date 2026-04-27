import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'inbox', title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-xl text-center">
      <span className="material-symbols-outlined text-[48px] text-outline-variant mb-md">{icon}</span>
      <h3 className="font-h3 text-h3 text-on-surface mb-xs">{title}</h3>
      {description && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">{description}</p>
      )}
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
};

export default EmptyState;
