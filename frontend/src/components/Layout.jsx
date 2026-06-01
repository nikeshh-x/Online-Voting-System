import React from 'react';
import Sidebar from './Sidebar';

function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - fixed, never scrolls */}
      <div className="h-full overflow-y-auto flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default Layout;