import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout wraps every admin page with the fixed sidebar.
 */
export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Fixed sidebar */}
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content area shifted right by sidebar width */}
      <div style={{
        flexGrow: 1,
        marginLeft: collapsed ? '68px' : '240px',
        transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '30px 32px 60px',
        minWidth: 0,
        background: 'transparent'
      }}>
        {children}
      </div>
    </div>
  );
}
