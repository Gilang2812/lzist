import React from 'react';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'Lzist', onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest border-b border-surface-variant px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-sm sm:gap-md">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-on-surface hover:text-primary transition-colors flex items-center justify-center p-sm rounded-full hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <button className="hidden md:flex text-on-surface hover:text-primary transition-colors items-center justify-center p-sm rounded-full hover:bg-surface-container-low">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-h2 text-[18px] sm:text-h2 text-on-surface truncate">{title}</h1>
      </div>
      {/* Right side header actions can be added here in the future (e.g., profile, notifications) */}
    </header>
  );
};

export default Header;
