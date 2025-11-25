import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    sales: true,
    inventory: true,
    reports: true,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!user) {
    return null;
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        section: 'main',
        items: [
          { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'receptionist', 'designer', 'worker', 'financial'] },
        ],
      },
    ];

    const salesSection = {
      section: 'sales',
      label: 'Sales & Orders',
      icon: '🛒',
      collapsible: true,
      items: [
        { path: '/clients', label: 'Clients', icon: '👥', roles: ['admin', 'receptionist'] },
        { path: '/invoices', label: 'Invoices', icon: '📄', roles: ['admin', 'designer', 'worker', 'financial'] },
        { path: '/orders', label: 'Orders', icon: '📦', roles: ['admin', 'designer', 'worker', 'financial'] },
      ],
    };

    const inventorySection = {
      section: 'inventory',
      label: 'Inventory',
      icon: '📦',
      collapsible: true,
      items: [
        { path: '/materials', label: 'Materials', icon: '🎨', roles: ['admin'] },
        { path: '/inventory', label: 'Stock Management', icon: '📊', roles: ['admin'] },
        { path: '/suppliers', label: 'Suppliers', icon: '🏭', roles: ['admin'] },
        { path: '/purchases', label: 'Purchases', icon: '🛍️', roles: ['admin'] },
      ],
    };

    const reportsSection = {
      section: 'reports',
      label: 'Reports',
      icon: '📈',
      collapsible: true,
      items: [
        { path: '/financial-stats', label: 'Financial Stats', icon: '💰', roles: ['admin', 'financial'] },
      ],
    };

    const settingsSection = {
      section: 'settings',
      label: 'Settings',
      icon: '⚙️',
      collapsible: false,
      items: [
        { path: '/users', label: 'User Management', icon: '👤', roles: ['admin'] },
      ],
    };

    const menu = [...baseItems];
    
    if (user.role === 'admin' || user.role === 'receptionist' || user.role === 'designer' || user.role === 'worker' || user.role === 'financial') {
      menu.push(salesSection);
    }
    
    if (user.role === 'admin') {
      menu.push(inventorySection);
    }
    
    if (user.role === 'admin' || user.role === 'financial') {
      menu.push(reportsSection);
    }
    
    if (user.role === 'admin') {
      menu.push(settingsSection);
    }

    return menu;
  };

  const menuItems = getMenuItems();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo & Brand */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <div className="brand-logo">
            <img src="/assets/logo.jpg" alt="Sendroli Group" className="logo-image" />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">Sendroli Group</span>
              <span className="brand-tagline">Printing Services</span>
            </div>
          )}
        </Link>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        {!collapsed && (
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role}</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            {section.label && section.collapsible && !collapsed && (
              <div
                className="section-header"
                onClick={() => toggleSection(section.section)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-label">{section.label}</span>
                <span className={`section-arrow ${expandedSections[section.section] ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
            )}
            
            <ul
              className={`nav-items ${
                section.collapsible && !expandedSections[section.section] && !collapsed
                  ? 'collapsed'
                  : ''
              }`}
            >
              {section.items
                .filter((item) => item.roles.includes(user.role))
                .map((item, itemIndex) => (
                  <li key={itemIndex} className="nav-item">
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                      title={collapsed ? item.label : ''}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                      {isActive(item.path) && <span className="active-indicator" />}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
          <span className="nav-icon">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

