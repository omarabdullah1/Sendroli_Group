import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination/Pagination';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import notificationService from '../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState(''); // filter by type
  const itemsPerPage = 20;

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter, categoryFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        page: currentPage,
        limit: itemsPerPage,
        filter,
        category: categoryFilter || undefined,
      });

      // Backend returns: { success, data: { notifications, unreadCount, pagination } }
      // notificationService already unwraps to response.data, so we get the full response
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
      setTotalPages(response.data?.pagination?.pages || 1);
      setTotalItems(response.data?.pagination?.total || 0);
    } catch (err) {
      notifyError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      notifyError('Failed to mark notification as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      success('All notifications marked as read');
      await fetchNotifications();
    } catch (err) {
      notifyError('Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setActionLoading(true);
      await notificationService.deleteNotification(notificationId);
      success('Notification deleted');
      await fetchNotifications();
    } catch (err) {
      notifyError('Failed to delete notification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('Are you sure you want to delete all read notifications?')) {
      return;
    }

    try {
      setActionLoading(true);
      await notificationService.deleteAllRead();
      success('All read notifications deleted');
      await fetchNotifications();
    } catch (err) {
      notifyError('Failed to delete notifications');
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order: '📋',
      invoice: '💰',
      payment: '💳',
      inventory: '📦',
      system: '⚙️',
      client: '👤',
    };
    return icons[type] || '📢';
  };

  const getTypeColor = (type) => {
    const colors = {
      order: '#3b82f6',
      invoice: '#10b981',
      payment: '#f59e0b',
      inventory: '#8b5cf6',
      system: '#6b7280',
      client: '#ec4899',
    };
    return colors[type] || '#6b7280';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-left">
          <h1>🔔 Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button
              className="btn-mark-all-read"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
            >
              ✓ Mark all as read
            </button>
          )}
          <button
            className="btn-delete-read"
            onClick={handleDeleteAllRead}
            disabled={actionLoading}
          >
            🗑️ Delete read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="order">Orders</option>
            <option value="invoice">Invoices</option>
            <option value="payment">Payments</option>
            <option value="inventory">Inventory</option>
            <option value="client">Clients</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {notifications.length} of {totalItems} notifications
        </div>
      </div>

      {actionLoading && (
        <div className="action-loading">
          Processing...
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <Loading message="Loading notifications..." size="medium" />
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>
            {filter === 'unread' 
              ? "You're all caught up! No unread notifications."
              : categoryFilter 
              ? `No ${categoryFilter} notifications found.`
              : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
              >
                <div className="notification-icon-container">
                  <div
                    className="notification-icon"
                    style={{ backgroundColor: getTypeColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>

                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span
                      className="notification-type-badge"
                      style={{ backgroundColor: getTypeColor(notification.type) }}
                    >
                      {notification.type}
                    </span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="btn-action btn-read"
                      onClick={() => handleMarkAsRead(notification._id)}
                      disabled={actionLoading}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(notification._id)}
                    disabled={actionLoading}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default Notifications;
