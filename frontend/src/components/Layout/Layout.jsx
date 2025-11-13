import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/dashboard">Factory Management</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/clients">Clients</Link>
          <Link to="/orders">Orders</Link>
          {user?.role === 'Admin' && <Link to="/users">Users</Link>}
        </div>
        <div className="navbar-user">
          <span className="user-info">
            {user?.username} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
