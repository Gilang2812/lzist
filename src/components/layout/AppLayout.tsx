import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import Header from './Header';
import BottomNav from './BottomNav';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <div className="flex min-h-screen">
        <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Area */}
        <div className="flex-grow md:ml-64 flex flex-col min-h-screen w-full pb-16 md:pb-0">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
