import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import clientService from '../../services/clientService';
import invoiceService from '../../services/invoiceService';
import notificationService from '../../services/notificationService';
import orderService from '../../services/orderService';
import './TopHeader.css';

const TopHeader = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, isOpen } = useSidebar();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const helpRef = useRef(null);
  const profileRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const notificationPollIntervalRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time ago helper
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingNotifications(true);
      const response = await notificationService.getNotifications({ limit: 50 });
      if (response.success) {
        // Backend returns: { success, data: { notifications, unreadCount, pagination } }
        setNotifications(response.data?.notifications || []);
        setUnreadCount(response.data?.unreadCount || 0);
      }
    } catch (error) {
      // Silently handle 404 - endpoint might not exist yet or server needs restart
      if (error.response?.status !== 404) {
        console.error('Error fetching notifications:', error);
      }
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user]);

  // Fetch unread count only (lighter request)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      // Silently handle 404 - endpoint might not exist yet or server needs restart
      if (error.response?.status !== 404) {
        console.error('Error fetching unread count:', error);
      }
      setUnreadCount(0);
    }
  }, [user]);

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for unread count every 30 seconds
      notificationPollIntervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
    }

    return () => {
      if (notificationPollIntervalRef.current) {
        clearInterval(notificationPollIntervalRef.current);
      }
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (notificationPollIntervalRef.current) {
        clearInterval(notificationPollIntervalRef.current);
      }
    };
  }, []);

  // Search functionality with proper error handling
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Cancel previous search if still in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this search
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsSearching(true);
    setSearchError(null);

    try {
      const searchQuery = query.trim();
      
      // Make parallel requests with abort signal support
      const canSearchClients = ['receptionist', 'designer', 'financial', 'admin'].includes(user?.role);

      const [clientsRes, ordersRes, invoicesRes] = await Promise.allSettled([
        canSearchClients 
          ? clientService.getClients({ search: searchQuery }).catch(err => {
              if (err.name === 'AbortError' || signal.aborted) throw err;
              return { error: err };
            })
          : Promise.resolve({ data: [] }),
        orderService.getOrders({ search: searchQuery }).catch(err => {
          if (err.name === 'AbortError' || signal.aborted) throw err;
          return { error: err };
        }),
        invoiceService.getInvoices({ search: searchQuery }).catch(err => {
          if (err.name === 'AbortError' || signal.aborted) throw err;
          return { error: err };
        }),
      ]);

      // Check if search was aborted
      if (signal.aborted) {
        return;
      }

      const results = [];
      let hasRateLimitError = false;
      let rateLimitMessage = '';

      // Process clients
      if (clientsRes.status === 'fulfilled' && !clientsRes.value?.error) {
        if (clientsRes.value?.data) {
          const clients = Array.isArray(clientsRes.value.data) ? clientsRes.value.data : [];
          clients.slice(0, 3).forEach(client => {
            results.push({
              id: client._id,
              type: 'client',
              title: client.name || client.factoryName,
              subtitle: client.phone || '',
              path: `/clients`,
            });
          });
        }
      } else if (clientsRes.status === 'rejected' || clientsRes.value?.error) {
        const error = clientsRes.reason || clientsRes.value?.error;
        if (error?.response?.status === 429 || error?.response?.data?.error === 'RATE_LIMIT_EXCEEDED') {
          hasRateLimitError = true;
          rateLimitMessage = error.response?.data?.message || 'Rate limit exceeded. Please wait a moment.';
        }
      }

      // Process orders
      if (ordersRes.status === 'fulfilled' && !ordersRes.value?.error) {
        if (ordersRes.value?.data) {
          const orders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [];
          orders.slice(0, 3).forEach(order => {
            results.push({
              id: order._id,
              type: 'order',
              title: `Order #${order.orderNumber || order._id.slice(-6)}`,
              subtitle: order.client?.name || 'Unknown Client',
              path: `/orders`,
            });
          });
        }
      } else if (ordersRes.status === 'rejected' || ordersRes.value?.error) {
        const error = ordersRes.reason || ordersRes.value?.error;
        if (error?.response?.status === 429 || error?.response?.data?.error === 'RATE_LIMIT_EXCEEDED') {
          hasRateLimitError = true;
          rateLimitMessage = error.response?.data?.message || 'Rate limit exceeded. Please wait a moment.';
        }
      }

      // Process invoices
      if (invoicesRes.status === 'fulfilled' && !invoicesRes.value?.error) {
        if (invoicesRes.value?.data) {
          const invoices = Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data : [];
          invoices.slice(0, 3).forEach(invoice => {
            results.push({
              id: invoice._id,
              type: 'invoice',
              title: `Invoice #${invoice.invoiceNumber || invoice._id.slice(-6)}`,
              subtitle: invoice.client?.name || 'Unknown Client',
              path: `/invoices`,
            });
          });
        }
      } else if (invoicesRes.status === 'rejected' || invoicesRes.value?.error) {
        const error = invoicesRes.reason || invoicesRes.value?.error;
        if (error?.response?.status === 429 || error?.response?.data?.error === 'RATE_LIMIT_EXCEEDED') {
          hasRateLimitError = true;
          rateLimitMessage = error.response?.data?.message || 'Rate limit exceeded. Please wait a moment.';
        }
      }

      if (hasRateLimitError) {
        setSearchError(rateLimitMessage);
        setSearchResults([]);
        setShowSearchResults(true);
      } else {
        setSearchResults(results);
        setShowSearchResults(true);
        setSearchError(null);
      }
    } catch (error) {
      if (error.name === 'AbortError' || signal.aborted) {
        return; // Search was cancelled, ignore error
      }
      
      console.error('Search error:', error);
      if (error?.response?.status === 429) {
        setSearchError(error.response?.data?.message || 'Too many requests. Please wait a moment before searching again.');
      } else {
        setSearchError('Search failed. Please try again.');
      }
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleSearchClick = (e) => {
    if (window.innerWidth <= 768 && !mobileSearchActive) {
      e.preventDefault();
      setMobileSearchActive(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const closeMobileSearch = () => {
    setMobileSearchActive(false);
    setSearchValue('');
    setShowSearchResults(false);
  };

  // Debounced search handler
  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    const query = e?.target?.value || searchValue;
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel any in-progress search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    // Debounce: wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  }, [searchValue, performSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      setSearchError(null);
      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      return;
    }

    // Trigger debounced search
    handleSearch(e);
  };

  const handleResultClick = (result) => {
    setSearchValue('');
    setShowSearchResults(false);
    navigate(result.path);
  };

  const handleNotificationClick = async () => {
    const wasOpen = showNotifications;
    setShowNotifications(!showNotifications);
    setShowHelp(false);
    setShowProfileMenu(false);
    
    // Fetch notifications when opening dropdown
    if (!wasOpen) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e?.stopPropagation();
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setUnreadCount(0);
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationItemClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      setShowNotifications(false);
      navigate(notification.actionUrl);
    } else {
      setShowNotifications(false);
    }
  };

  const handleHelpClick = () => {
    setShowHelp(!showHelp);
    setShowNotifications(false);
    setShowProfileMenu(false);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
    setShowHelp(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="header-content">
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isOpen ? (
              // Close icon (X)
              <>
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            ) : (
              // Hamburger icon
              <>
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            )}
          </svg>
        </button>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearch} 
          className={`header-search ${mobileSearchActive ? 'mobile-active' : ''}`} 
          ref={searchRef}
        >
          <button 
            type="submit" 
            className="search-icon-btn"
            onClick={handleSearchClick}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search clients, orders, invoices..."
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0 || searchError || isSearching) {
                setShowSearchResults(true);
              }
            }}
            className="search-input"
            disabled={isSearching}
          />
          
          {/* Close Button for Mobile */}
          {mobileSearchActive && (
            <button 
              type="button" 
              className="search-close-btn"
              onClick={(e) => {
                e.preventDefault();
                closeMobileSearch();
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Loading indicator */}
          {isSearching && (
            <div className="search-loading">
              <div className="search-spinner"></div>
            </div>
          )}
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="search-results-dropdown">
              {searchError ? (
                <div className="search-error">
                  <div className="search-error-icon">⚠️</div>
                  <div className="search-error-message">{searchError}</div>
                </div>
              ) : isSearching ? (
                <div className="search-loading-state">
                  <div className="search-spinner-small"></div>
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="search-results-header">Search Results</div>
                  {searchResults.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="search-result-item"
                      onClick={() => handleResultClick(result)}
                    >
                  <div className="search-result-icon">
                    {/* Icons removed for unified design */}
                  </div>
                      <div className="search-result-content">
                        <div className="search-result-title">{result.title}</div>
                        <div className="search-result-subtitle">{result.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchValue.trim() ? (
                <div className="search-no-results">No results found</div>
              ) : null}
            </div>
          )}
        </form>

        {/* Right Side Actions */}
        <div className="top-header-actions">
          {/* Help Icon */}
          <div className="header-dropdown-wrapper" ref={helpRef}>
            <button 
              className="header-icon-btn" 
              title="Help & Support"
              onClick={handleHelpClick}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 14.1667H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 10.8333C10.4602 10.8333 10.8333 10.4602 10.8333 10C10.8333 9.53976 10.4602 9.16667 10 9.16667C9.53976 9.16667 9.16667 9.53976 9.16667 10C9.16667 10.4602 9.53976 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 5.83333C9.12452 5.83333 8.33333 6.62452 8.33333 7.5C8.33333 7.96024 8.70643 8.33333 9.16667 8.33333H10.8333C11.2936 8.33333 11.6667 7.96024 11.6667 7.5C11.6667 6.12452 10.8755 5.83333 10 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showHelp && (
              <div className="help-dropdown">
                <div className="help-dropdown-header">Help & Support</div>
                <div className="help-dropdown-item" onClick={() => { setShowHelp(false); navigate('/dashboard'); }}>
                  <span>Dashboard Guide</span>
                </div>
                <div className="help-dropdown-item" onClick={() => { setShowHelp(false); window.open('mailto:support@sendroli.com', '_blank'); }}>
                  <span>Contact Support</span>
                </div>
                <div className="help-dropdown-item" onClick={() => { setShowHelp(false); alert('Keyboard Shortcuts:\n\nCtrl+K / Cmd+K - Search\nEsc - Close dialogs'); }}>
                  <span>Keyboard Shortcuts</span>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Icon */}
          <div className="header-dropdown-wrapper" ref={notificationRef}>
            <button 
              className="header-icon-btn notification-btn" 
              title="Notifications"
              onClick={handleNotificationClick}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6.66667C15 5.34058 14.4732 4.06881 13.5355 3.13115C12.5979 2.19349 11.3261 1.66667 10 1.66667C8.67392 1.66667 7.40215 2.19349 6.46447 3.13115C5.52681 4.06881 5 5.34058 5 6.66667C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.4417 17.5C11.1435 17.7631 10.7656 17.9014 10.375 17.9014C9.98441 17.9014 9.60654 17.7631 9.30833 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span 
                      className="notification-mark-all" 
                      onClick={handleMarkAllAsRead}
                      style={{ cursor: 'pointer' }}
                    >
                      Mark all as read
                    </span>
                  )}
                </div>
                <div className="notification-list">
                  {loadingNotifications ? (
                    <div className="notification-empty">Loading...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationItemClick(notification)}
                      >
                        <div className="notification-item-content">
                          <div className="notification-item-title">{notification.title}</div>
                          <div className="notification-item-message">{notification.message}</div>
                          <div className="notification-item-time">
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </div>
                        {!notification.read && <div className="notification-dot"></div>}
                      </div>
                    ))
                  ) : (
                    <div className="notification-empty">No notifications</div>
                  )}
                </div>
                <div className="notification-dropdown-footer">
                  <button onClick={() => { setShowNotifications(false); navigate('/notifications'); }}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="profile-dropdown" ref={profileRef}>
            <button className="profile-btn" onClick={handleProfileClick}>
              <div className="profile-avatar">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>
            {showProfileMenu && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-name">{user?.fullName || 'User'}</div>
                  <div className="profile-menu-email">{user?.email || ''}</div>
                  <div className="profile-menu-role">{user?.role || ''}</div>
                </div>
                <div className="profile-menu-divider"></div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}>
                  <span>Dashboard</span>
                </div>
                <div className="profile-menu-item" onClick={() => { setShowProfileMenu(false); alert('Profile settings coming soon!'); }}>
                  <span>Settings</span>
                </div>
                <div className="profile-menu-divider"></div>
                <div className="profile-menu-item logout-item" onClick={handleLogout}>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;

