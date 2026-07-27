import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dental-layout">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dental-body">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`dental-content ${sidebarOpen ? '' : 'expanded'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
