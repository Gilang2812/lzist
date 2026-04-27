import React from 'react';

interface FABProps {
  icon?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const FAB: React.FC<FABProps> = ({ icon = 'add', label, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 md:bottom-6 right-6 z-30 bg-primary text-on-primary rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-sm ${label ? 'px-lg py-md' : 'p-md'} ${className}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label && <span className="font-label-md text-label-md">{label}</span>}
    </button>
  );
};

export default FAB;
