import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen = false, onClose }) => {
  const { isInstallable, handleInstallClick } = useInstallPrompt();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose} 
        />
      )}
      <aside className={`fixed left-0 top-0 flex flex-col h-full py-6 px-4 w-64 border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center text-white">
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-inter">Lzist</h2>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Stock Management</p>
        </div>
      </div>
      
      <nav className="flex-grow space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out font-inter text-sm ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold border-r-4 border-teal-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
        {isInstallable && (
          <button 
            onClick={handleInstallClick} 
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium text-sm border border-gray-200 dark:border-gray-700"
          >
            <span className="material-symbols-outlined text-sm">install_mobile</span>
            Install App
          </button>
        )}
        <NavLink to="/restock/new" onClick={onClose} className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-sm">
          <span className="material-symbols-outlined text-sm">add</span>
          New Entry
        </NavLink>
        <div className="mt-6 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-600">person</span>
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@lzist.com</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default SideNav;
