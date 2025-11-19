import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Link to="/" style={styles.brandLink}>
            Factory Management System
          </Link>
        </div>

        <div style={styles.menu}>
          {/* Role-based menu items */}
          {user.role === 'receptionist' && (
            <>
              <Link to="/clients" style={styles.link}>
                Clients
              </Link>
            </>
          )}

          {user.role === 'designer' && (
            <>
              <Link to="/orders" style={styles.link}>
                Orders
              </Link>
            </>
          )}

          {user.role === 'worker' && (
            <>
              <Link to="/orders" style={styles.link}>
                Orders
              </Link>
            </>
          )}

          {user.role === 'financial' && (
            <>
              <Link to="/orders" style={styles.link}>
                Orders
              </Link>
              <Link to="/financial-stats" style={styles.link}>
                Financial Stats
              </Link>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <Link to="/clients" style={styles.link}>
                Clients
              </Link>
              <Link to="/orders" style={styles.link}>
                Orders
              </Link>
              <Link to="/users" style={styles.link}>
                Users
              </Link>
              <Link to="/financial-stats" style={styles.link}>
                Financial Stats
              </Link>
            </>
          )}

          <div style={styles.userInfo}>
            <span style={styles.username}>
              {user.fullName} ({user.role})
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  brandLink: {
    color: '#fff',
    textDecoration: 'none',
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  link: {
    color: '#ecf0f1',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginLeft: '1rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid #34495e',
  },
  username: {
    color: '#ecf0f1',
    fontSize: '0.9rem',
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

export default Navbar;
