import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/prodpilot-logo.jpg';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard"><img className="brand-logo" src={logo} alt="ProdPilot logo" /><span>ProdPilot</span></NavLink>
        <nav aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span>▦</span> Dashboard</NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span>☷</span> My tasks</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-summary"><span className="avatar">{initials || 'U'}</span><span><strong>{user?.name}</strong><small>{user?.email}</small></span></div>
          <button className="nav-link logout" onClick={logout}><span>↪</span> Sign out</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
