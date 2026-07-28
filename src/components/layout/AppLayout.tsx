import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import Header from './Header';
import BottomNav from './BottomNav';
import ReloadPrompt from './ReloadPrompt';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <div className="flex min-h-screen">
        <SideNav 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        
        {/* Main Content Area */}
        <div className={`flex-grow transition-all duration-300 ease-in-out flex flex-col min-h-screen w-full pb-16 md:pb-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <Header />
          <Outlet />
        </div>
      </div>
      <BottomNav />
      <ReloadPrompt />
    </div>
  );
};

export default AppLayout;
