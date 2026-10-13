import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  LayoutDashboard, Package, Users, ClipboardList, ArrowLeftRight,
  RotateCcw, AlertTriangle, FileText, LogOut, Menu, X,
  BookOpen, History, Shield
} from 'lucide-react';

function NavLink({ icon: Icon, label, path, active, onClick }) {
  return (
    <button className={`nav-link ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon className="nav-icon" size={17} />
      {label}
    </button>
  );
}

export default function AppLayout({ children, title, subtitle }) {
  const { user, isAdmin, signOut } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const pendingRenewals = state.renewals.filter(r => r.status === 'pending').length;
  const overdueCount = state.issues.filter(i => i.status === 'overdue').length;

  const [mobileOpen, setMobileOpen] = useState(false);
  const go = (path) => { navigate(path); setMobileOpen(false); };
  const at = (path) =>
    path === '/admin' || path === '/student'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const adminNav = [
    { section: 'Overview', links: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    ]},
    { section: 'Inventory', links: [
      { icon: Package, label: 'Inventory Items', path: '/admin/inventory' },
      { icon: Shield, label: 'Assets', path: '/admin/assets' },
    ]},
    { section: 'Students & Issues', links: [
      { icon: Users, label: 'Students', path: '/admin/students' },
      { icon: ClipboardList, label: 'Issue Items', path: '/admin/issues' },
      { icon: ArrowLeftRight, label: 'Returns', path: '/admin/returns' },
    ]},
    { section: 'Renewals & Monitoring', links: [
      { icon: RotateCcw, label: `Renewals ${pendingRenewals > 0 ? `(${pendingRenewals})` : ''}`, path: '/admin/renewals' },
      { icon: AlertTriangle, label: `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ''}`, path: '/admin/overdue' },
    ]},
    { section: 'Reports', links: [
      { icon: History, label: 'Transaction Log', path: '/admin/transactions' },
      { icon: FileText, label: 'Reports & Export', path: '/admin/reports' },
      { icon: FileText, label: 'Stock Adjustments', path: '/admin/adjustments' },
    ]},
  ];

  const studentNav = [
    { section: 'My Borrowings', links: [
      { icon: LayoutDashboard, label: 'My Dashboard', path: '/student' },
      { icon: BookOpen, label: 'My Issues', path: '/student/issues' },
      { icon: RotateCcw, label: 'My Renewals', path: '/student/renewals' },
    ]},
  ];

  const nav = isAdmin ? adminNav : studentNav;

  return (
    <div className="app-shell">
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>NFSU InventoryHub</h1>
          <span>Inventory Management System</span>
        </div>
        <nav className="sidebar-nav">
          {nav.map(group => (
            <div key={group.section} className="nav-group">
              <div className="nav-group-label">{group.section}</div>
              {group.links.map(link => (
                <NavLink
                  key={link.path}
                  icon={link.icon}
                  label={link.label}
                  path={link.path}
                  active={at(link.path)}
                  onClick={() => go(link.path)}
                />
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role === 'admin' ? user?.display || 'Administrator' : 'Student'}</div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
            onClick={() => { signOut(); navigate('/login'); }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="demo-banner">
          ⚠ DEMONSTRATION PROTOTYPE – Synthetic data only · Not production-ready
        </div>
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-icon btn-secondary mobile-menu-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, background: user?.role === 'admin' ? '#fee2e2' : '#dcfce7', color: user?.role === 'admin' ? '#991b1b' : '#166534', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
