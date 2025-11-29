import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Logo from '../Logo';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = isCollapsed;
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

  // Close sidebar on mobile when clicking a link
  useEffect(() => {
    const handleLinkClick = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        closeSidebar();
      }
    };
    
    // Close sidebar when route changes on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && isOpen) {
      handleLinkClick();
    }
  }, [location.pathname, isOpen, closeSidebar]);

  if (!user) {
    return null;
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        section: 'main',
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'receptionist', 'designer', 'worker', 'financial'] },
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
        { path: '/invoices', label: 'Invoices', icon: '📄', roles: ['admin', 'designer', 'financial'] },
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
        { path: '/inventory', label: 'Stock Management', icon: '📊', roles: ['admin', 'worker'] },
        { path: '/material-withdrawal', label: 'Material Withdrawal', icon: '📤', roles: ['admin', 'worker'] },
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
        { path: '/client-reports', label: 'Client Reports', icon: '📊', roles: ['admin', 'financial', 'receptionist'] },
      ],
    };

    const settingsSection = {
      section: 'settings',
      label: 'Settings',
      icon: '⚙️',
      collapsible: false,
      items: [
        { path: '/users', label: 'User Management', icon: '👤', roles: ['admin'] },
        { path: '/website-settings', label: 'Website Settings', icon: '🌐', roles: ['admin'] },
      ],
    };

    const menu = [...baseItems];
    
    if (user.role === 'admin' || user.role === 'receptionist' || user.role === 'designer' || user.role === 'worker' || user.role === 'financial') {
      menu.push(salesSection);
    }
    
    if (user.role === 'admin' || user.role === 'worker') {
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
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
      {/* Logo & Brand */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-brand">
          <div className="brand-logo">
            <Logo 
              variant={collapsed ? 'icon' : 'full'} 
              size="medium" 
              alt="Sendroli Group" 
            />
          </div>
        </Link>
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
                      {collapsed && item.icon && (
                        <span className="nav-icon">{item.icon}</span>
                      )}
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                      {isActive(item.path) && <span className="active-indicator" />}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer with Logout and Toggle */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
          {collapsed && <span className="logout-icon">🚪</span>}
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          className="sidebar-toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollapse();
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;

