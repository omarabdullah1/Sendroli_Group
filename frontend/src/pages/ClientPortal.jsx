import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import './ClientPortal.css';

const ClientPortal = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="client-portal-container">
      <div className="client-portal-header">
        <div className="portal-logo">
          <Logo variant="full" size="medium" alt="Sendroli Group" />
        </div>
        <div className="portal-user-info">
          <span>Welcome, {user?.fullName || user?.username}</span>
          <button onClick={handleLogout} className="portal-logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="client-portal-content">
        <div className="portal-message-card">
          <div className="message-icon">🚧</div>
          <h1>Client Portal Under Development</h1>
          <p className="message-description">
            We're working hard to bring you an amazing client experience.
            The client portal is currently under development and will be available soon.
          </p>

          <div className="portal-features">
            <h3>Coming Soon:</h3>
            <ul>
              <li>📋 View your order history</li>
              <li>📊 Track order status in real-time</li>
              <li>💰 Access invoices and payment information</li>
              <li>📞 Direct communication with our team</li>
              <li>📁 Download design files and documents</li>
            </ul>
          </div>

          <div className="contact-support">
            <h3>Need Order Updates?</h3>
            <p>Please contact our support team for any inquiries:</p>
            <div className="support-options">
              <a href="tel:+201234567890" className="support-link">
                📞 Call Us
              </a>
              <a href="https://wa.me/201234567890" className="support-link" target="_blank" rel="noopener noreferrer">
                💬 WhatsApp
              </a>
              <a href="mailto:info@sendroligroup.com" className="support-link">
                ✉️ Email Us
              </a>
            </div>
          </div>

          <Link to="/" className="back-to-website-btn">
            ← Back to Website
          </Link>
        </div>
      </div>

      <div className="portal-footer">
        <p>&copy; {new Date().getFullYear()} Sendroli Group. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ClientPortal;

