import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';

const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-surface-variant flex justify-around items-center h-16 px-2 safe-area-bottom">
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`
          }
        >
          <span className={`material-symbols-outlined text-[22px]`}>{item.icon}</span>
          <span className="text-[10px] font-medium leading-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
