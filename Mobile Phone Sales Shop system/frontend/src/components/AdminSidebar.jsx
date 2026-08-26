import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import {
  LayoutDashboard,
  Tag,
  Grid3X3,
  Smartphone,
  Box,
  ShoppingCart,
  Wrench,
  Users,
  BarChart2,
  UserCog,
  LogOut,
  ChevronDown,
  List,
  Percent,
  ArrowUpDown,
  ClipboardList,
  UserCheck,
  Menu,
  X,
  Plus
} from 'lucide-react';

function AdminSidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = user?.role || '';
  const isAdmin = role === 'Admin';
  const isSales = role === 'Sales person';
  const isTechnician = role === 'Technician';
  const isAdminOrSales = isAdmin || isSales;

  const path = location.pathname;

  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isOpen = (key, paths) => {
    return openMenus[key] !== undefined ? openMenus[key] : paths.some(p => path.startsWith(p));
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'MM';

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const sidebarContent = (
    <div
      className="sidebar-scroll-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: collapsed ? '18px 10px' : '18px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        height: '65px',
        flexShrink: 0
      }}>
        {!collapsed && (
          <span style={{
            fontSize: '19px',
            fontWeight: '800',
            background: 'linear-gradient(90deg, #ec4899, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>MobileMart</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s'
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={18} /> : <X size={16} />}
        </button>
      </div>

      {/* User Info Card */}
      <div style={{
        padding: collapsed ? '14px 8px' : '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '800',
          color: '#fff',
          flexShrink: 0,
          border: '2px solid rgba(99,102,241,0.4)',
          boxShadow: '0 0 10px rgba(99,102,241,0.3)'
        }}>
          {initials}
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: '600', textTransform: 'capitalize' }}>
              {role}
            </p>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{
        padding: collapsed ? '12px 6px' : '12px 12px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>

        {/* Dashboard */}
        <NavItem
          to="/admin"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          active={path === '/admin'}
          collapsed={collapsed}
        />

        {/* Catalog Section */}
        {isAdmin && (
          <>
            <SectionLabel label="Catalog" collapsed={collapsed} />

            <SubMenu
              icon={<Tag size={18} />}
              label="Brands"
              collapsed={collapsed}
              open={isOpen('brands', ['/admin/add-brand', '/admin/manage-brand', '/admin/edit-brand'])}
              onToggle={() => toggleMenu('brands')}
              active={path === '/admin/add-brand' || path === '/admin/manage-brand' || path.startsWith('/admin/edit-brand')}
            >
              <SubItem to="/admin/add-brand" label="Add Brand" icon={<Plus size={13} />} active={path === '/admin/add-brand'} />
              <SubItem to="/admin/manage-brand" label="Manage Brands" icon={<List size={13} />} active={path === '/admin/manage-brand'} />
            </SubMenu>

            <SubMenu
              icon={<Grid3X3 size={18} />}
              label="Categories"
              collapsed={collapsed}
              open={isOpen('cats', ['/admin/add-category', '/admin/manage-category', '/admin/edit-category'])}
              onToggle={() => toggleMenu('cats')}
              active={path === '/admin/add-category' || path === '/admin/manage-category' || path.startsWith('/admin/edit-category')}
            >
              <SubItem to="/admin/add-category" label="Add Category" icon={<Plus size={13} />} active={path === '/admin/add-category'} />
              <SubItem to="/admin/manage-category" label="Manage Categories" icon={<List size={13} />} active={path === '/admin/manage-category'} />
            </SubMenu>

            <SubMenu
              icon={<Smartphone size={18} />}
              label="Products"
              collapsed={collapsed}
              open={isOpen('products', ['/admin/add-product', '/admin/manage-product', '/admin/editproducts', '/admin/edit-product', '/admin/pricing'])}
              onToggle={() => toggleMenu('products')}
              active={path === '/admin/add-product' || path === '/admin/manage-product' || path.startsWith('/admin/edit') || path === '/admin/pricing'}
            >
              <SubItem to="/admin/add-product" label="Add Product" icon={<Plus size={13} />} active={path === '/admin/add-product'} />
              <SubItem to="/admin/manage-product" label="Manage Products" icon={<List size={13} />} active={path === '/admin/manage-product'} />
              <SubItem to="/admin/pricing" label="Pricing & Discounts" icon={<Percent size={13} />} active={path === '/admin/pricing'} />
            </SubMenu>
          </>
        )}

        {/* Inventory Section */}
        {isAdmin && (
          <>
            <SectionLabel label="Inventory" collapsed={collapsed} />

            <SubMenu
              icon={<Box size={18} />}
              label="Inventory"
              collapsed={collapsed}
              open={isOpen('inventory', ['/admin/inventory', '/admin/stock', '/admin/add-stock'])}
              onToggle={() => toggleMenu('inventory')}
              active={path === '/admin/inventory' || path === '/admin/stock' || path === '/admin/add-stock'}
            >
              <SubItem to="/admin/stock" label="Batch Stock List" icon={<ClipboardList size={13} />} active={path === '/admin/stock'} />
              <SubItem to="/admin/add-stock" label="Receive Stock Batch" icon={<Plus size={13} />} active={path === '/admin/add-stock'} />
              <SubItem to="/admin/inventory" label="Catalog & Correction" icon={<ArrowUpDown size={13} />} active={path === '/admin/inventory'} />
            </SubMenu>
          </>
        )}

        {/* Orders Section */}
        {isAdminOrSales && (
          <>
            <SectionLabel label="Sales" collapsed={collapsed} />

            <SubMenu
              icon={<ShoppingCart size={18} />}
              label="Orders"
              collapsed={collapsed}
              open={isOpen('orders', ['/admin/orders', '/admin/add-order', '/admin/add_order'])}
              onToggle={() => toggleMenu('orders')}
              active={path.startsWith('/admin/orders') || path.startsWith('/admin/add-order') || path.startsWith('/admin/add_order')}
            >
              <SubItem to="/admin/add-order" label="Create Order" icon={<Plus size={13} />} active={path === '/admin/add-order' || path === '/admin/add-order.php'} />
              <SubItem to="/admin/orders" label="Manage Orders" icon={<List size={13} />} active={path === '/admin/orders' || path === '/admin/orders.php' || path === '/admin/manage-orders'} />
            </SubMenu>
          </>
        )}

        {/* Service Section */}
        <SectionLabel label="Service" collapsed={collapsed} />

        <SubMenu
          icon={<Wrench size={18} />}
          label="Repairs"
          collapsed={collapsed}
          open={isOpen('repairs', ['/admin/repairs', '/admin/add-repair', '/admin/manage-repair', '/admin/manage-repairs'])}
          onToggle={() => toggleMenu('repairs')}
          active={path.startsWith('/admin/repairs') || path.startsWith('/admin/add-repair') || path.startsWith('/admin/manage-repair') || path.startsWith('/admin/manage-repairs')}
        >
          {!isTechnician && (
            <SubItem to="/admin/add-repair" label="Log Repair" icon={<Plus size={13} />} active={path === '/admin/add-repair' || path === '/admin/add-repair.php'} />
          )}
          <SubItem to="/admin/manage-repair" label="Manage Repairs" icon={<List size={13} />} active={path === '/admin/manage-repair' || path === '/admin/manage-repair.php' || path === '/admin/manage-repairs' || path === '/admin/manage-repairs.php' || path === '/admin/repairs'} />
        </SubMenu>

        {/* Customers */}
        {isAdminOrSales && (
          <NavItem
            to="/admin/users"
            icon={<UserCheck size={18} />}
            label="Customers"
            active={path === '/admin/users'}
            collapsed={collapsed}
          />
        )}

        {/* Analytics */}
        {isAdminOrSales && (
          <>
            <SectionLabel label="Analytics" collapsed={collapsed} />
            <NavItem
              to="/admin/reports"
              icon={<BarChart2 size={18} />}
              label="Reports"
              active={path === '/admin/reports'}
              collapsed={collapsed}
            />
          </>
        )}

        {/* Staff Management */}
        {isAdmin && (
          <>
            <SectionLabel label="System" collapsed={collapsed} />
            <SubMenu
              icon={<UserCog size={18} />}
              label="Staff Accounts"
              collapsed={collapsed}
              open={isOpen('staff', ['/admin/staff', '/admin/add-staff', '/admin/adm_add_staff.php', '/admin/adm_view_staff.php'])}
              onToggle={() => toggleMenu('staff')}
              active={path.startsWith('/admin/staff') || path.startsWith('/admin/add-staff') || path.includes('staff')}
            >
              <SubItem to="/admin/add-staff" label="Add Staff" icon={<Plus size={13} />} active={path === '/admin/add-staff' || path === '/admin/adm_add_staff.php'} />
              <SubItem to="/admin/staff" label="Manage Staff" icon={<Users size={13} />} active={path === '/admin/staff' || path === '/admin/adm_view_staff.php' || path === '/admin/manage-staff'} />
            </SubMenu>
          </>
        )}
      </nav>

      {/* Logout Footer */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0
      }}>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '10px',
            width: '100%',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            padding: '10px',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 300,
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '8px',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        className="sidebar-mobile-toggle"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 199,
            backdropFilter: 'blur(4px)'
          }}
          className="sidebar-overlay"
        />
      )}

      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        height: '100vh',
        width: collapsed ? '68px' : '240px',
        background: 'rgba(10, 16, 33, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s ease',
        zIndex: 200,
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
      }}>
        {sidebarContent}
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of the administration portal?"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
          navigate('/');
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* CSS overrides for hiding scrollbar & responsive mode */}
      <style>{`
        .sidebar-scroll-container::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        @media (max-width: 768px) {
          .sidebar-mobile-toggle { display: flex !important; }
          .sidebar-overlay { display: block !important; }
          aside {
            left: ${mobileOpen ? '0' : '-260px'} !important;
            width: 240px !important;
          }
        }
      `}</style>
    </>
  );
}

// ── Item Helpers ───────────────────────────────────────────────────

function NavItem({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '10px',
        padding: collapsed ? '10px' : '9px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: active ? '700' : '500',
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
        background: active
          ? 'linear-gradient(90deg, rgba(99,102,241,0.25), rgba(99,102,241,0.1))'
          : 'transparent',
        borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
        textDecoration: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
        }
      }}
    >
      <span style={{ flexShrink: 0, color: active ? '#818cf8' : 'inherit', display: 'flex', alignItems: 'center' }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SubMenu({ icon, label, collapsed, open, onToggle, active, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={onToggle}
        title={collapsed ? label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : '10px',
          padding: collapsed ? '10px' : '9px 12px',
          borderRadius: '8px',
          width: '100%',
          fontSize: '13px',
          fontWeight: active ? '700' : '500',
          color: active ? '#fff' : 'rgba(255,255,255,0.65)',
          background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
          borderLeft: active ? '3px solid rgba(99,102,241,0.6)' : '3px solid transparent',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'space-between',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '10px', color: active ? '#818cf8' : 'inherit', flexShrink: 0 }}>
          {icon}
          {!collapsed && <span>{label}</span>}
        </span>
        {!collapsed && (
          <span style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronDown size={14} />
          </span>
        )}
      </button>

      {open && !collapsed && (
        <div style={{
          marginLeft: '24px',
          marginTop: '2px',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          paddingLeft: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          paddingBottom: '4px'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SubItem({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: active ? '700' : '400',
        color: active ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
        background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {icon && <span style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </Link>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />;
  return (
    <p style={{
      fontSize: '10px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'rgba(255,255,255,0.25)',
      padding: '12px 10px 4px',
      margin: 0
    }}>{label}</p>
  );
}

export default AdminSidebar;

