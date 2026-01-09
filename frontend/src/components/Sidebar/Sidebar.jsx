import {
  faArrowUp,
  faBell,
  faBox,
  faChartBar,
  faChartLine,
  faChartPie,
  faChevronDown,
  faClipboard,
  faCog,
  faDollarSign,
  faFileInvoice,
  faGlobe,
  faIndustry,
  faPalette,
  faShoppingBag,
  faShoppingCart,
  faUser,
  faUsers,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
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
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      closeSidebar();
    }
  }, [location.pathname]); // Only run when location changes

  if (!user) {
    return null;
  }

  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        section: 'main',
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: faChartLine, roles: ['admin', 'receptionist', 'designer', 'worker', 'financial'] },
          { path: '/notifications', label: 'Notifications', icon: faBell, roles: ['admin', 'receptionist', 'designer', 'worker', 'financial'] },
        ],
      },
    ];

    const salesSection = {
      section: 'sales',
      label: 'Sales & Orders',
      icon: faShoppingCart,
      collapsible: true,
      items: [
        { path: '/clients', label: 'Clients', icon: faUsers, roles: ['admin', 'receptionist'] },
        { path: '/invoices', label: 'Invoices', icon: faFileInvoice, roles: ['admin', 'designer', 'financial'] },
        { path: '/orders', label: 'Orders', icon: faBox, roles: ['admin', 'designer', 'worker', 'financial'] },
      ],
    };

    const inventorySection = {
      section: 'inventory',
      label: 'Inventory',
      icon: faWarehouse,
      collapsible: true,
      items: [
        { path: '/materials', label: 'Materials', icon: faPalette, roles: ['admin'] },
        { path: '/products', label: 'Products', icon: faBoxOpen, roles: ['admin', 'designer'] },
        { path: '/inventory', label: 'Stock Management', icon: faChartLine, roles: ['admin', 'worker'] },
        { path: '/material-withdrawal', label: 'Material Withdrawal', icon: faArrowUp, roles: ['admin', 'worker'] },
        { path: '/suppliers', label: 'Suppliers', icon: faIndustry, roles: ['admin'] },
        { path: '/purchases', label: 'Purchases', icon: faShoppingBag, roles: ['admin'] },
      ],
    };

    const reportsSection = {
      section: 'reports',
      label: 'Reports',
      icon: faChartBar,
      collapsible: true,
      items: [
        { path: '/reports/client-analytics', label: 'Client Analytics', icon: faChartPie, roles: ['admin', 'financial'] },
        { path: '/financial-report', label: 'Financial Report', icon: faChartLine, roles: ['admin', 'financial'] },
        { path: '/financial-stats', label: 'Financial Stats', icon: faDollarSign, roles: ['admin', 'financial'] },
        { path: '/client-reports', label: 'Client Reports', icon: faClipboard, roles: ['admin', 'financial'] },
      ],
    };

    const settingsSection = {
      section: 'settings',
      label: 'Settings',
      icon: faCog,
      collapsible: false,
      items: [
        { path: '/users', label: 'User Management', icon: faUser, roles: ['admin'] },
        { path: '/website-settings', label: 'Website Settings', icon: faGlobe, roles: ['admin'] },
      ],
    };
    const menu = [...baseItems];

    if (user.role === 'admin' || user.role === 'receptionist' || user.role === 'designer' || user.role === 'worker' || user.role === 'financial') {
      menu.push(salesSection);
    }

    if (user.role === 'admin' || user.role === 'worker') {
      menu.push(inventorySection);
    }

    if (user.role === 'admin' || user.role === 'financial' || user.role === 'receptionist') {
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

      <div
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}
        style={isOpen && typeof window !== 'undefined' && window.innerWidth <= 768 ? { transform: 'translateX(0)', zIndex: 1002, display: 'flex' } : {}}
      >
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
                    <FontAwesomeIcon icon={faChevronDown} />
                  </span>
                </div>
              )}

              <ul
                className={`nav-items ${section.collapsible && !expandedSections[section.section] && !collapsed
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
                        {item.icon && (
                          <span className="nav-icon">
                            <FontAwesomeIcon icon={item.icon} />
                          </span>
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

