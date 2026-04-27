import React from 'react';

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="flex flex-wrap gap-sm">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className="flex items-center gap-sm px-md py-sm bg-surface-container-lowest rounded-xl border border-surface-variant hover:border-primary-fixed-dim hover:shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">{action.icon}</span>
          <span className="font-body-sm text-body-sm text-on-surface">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
