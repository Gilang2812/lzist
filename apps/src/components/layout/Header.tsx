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
      <div className="flex items-center gap-md">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary-container w-64" placeholder="Cari barang..." type="text"/>
        </div>
        <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors focus:ring-2 focus:ring-primary-container focus:ring-offset-2">
          Selesai
        </button>
      </div>
    </header>
  );
};

export default Header;
