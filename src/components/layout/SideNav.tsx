import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen = false, onClose, isCollapsed = false, onToggleCollapse }) => {
  const { isInstallable, handleInstallClick } = useInstallPrompt();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose} 
        />
      )}
      <aside className={`fixed left-0 top-0 flex flex-col h-full py-6 bg-white rounded dark:shadow-none z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20 px-2' : 'w-64 px-4'}`}>
      <div className={`flex items-center mb-8 ${isCollapsed ? 'flex-col gap-4 mt-2' : 'justify-between px-2'}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-10 w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-inter">Lzist</h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Stock Management</p>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <span className="material-symbols-outlined text-xl">
              {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        )}
      </div>
      
      <nav className="flex-grow space-y-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex transition-all duration-200 ease-in-out font-inter ${
                isCollapsed ? 'flex-col items-center justify-center py-2 px-1 rounded-xl text-center gap-1' : 'flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-sm'
              } ${
                isActive
                  ? `bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold border-teal-400 ${isCollapsed ? '' : 'border-r-4'}`
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium'
              }`
            }
          >
            <span className="material-symbols-outlined shrink-0">{item.icon}</span>
            {isCollapsed ? (
              <span className="text-[10px] leading-tight truncate w-full">{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">

        {isInstallable && (
          <button 
            onClick={handleInstallClick} 
            className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium border border-gray-200 dark:border-gray-700 ${isCollapsed ? 'flex-col px-1 text-[10px]' : 'text-sm mb-3'}`}
            title="Install App"
          >
            <span className="material-symbols-outlined text-sm">install_mobile</span>
            {!isCollapsed && <span>Install App</span>}
            {isCollapsed && <span className="text-center leading-tight">Install</span>}
          </button>
        )}
        <div className={`mt-4 flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="min-w-10 w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-teal-600">person</span>
          </div>
          {!isCollapsed && (
            <div className="grow overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@lzist.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default SideNav;
