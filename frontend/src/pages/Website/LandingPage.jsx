import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import websiteService from '../../services/websiteService';
import Loading from '../../components/Loading';
import './LandingPage.css';

const LandingPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await websiteService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching website settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Loading message="Loading..." size="large" fullScreen />
    );
  }

  if (!settings) {
    return <div className="error-message">Failed to load website content</div>;
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="website-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Logo variant="full" size="medium" alt={settings.logo.altText} className="logo-svg" />
          </div>
          <ul className="nav-links">
            <li><a href="#hero">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#why-choose-us">Why Us</a></li>
            <li><a href="#portfolio">Portfolio</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          {isAuthenticated && user ? (
            <div className="nav-user-menu">
              <div className="nav-user-info">
                <div className="nav-user-avatar">
                  {user.fullName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="nav-user-details">
                  <span className="nav-user-name">{user.fullName || user.username}</span>
                  <span className="nav-user-role">{user.role}</span>
                </div>
              </div>
              <div className="nav-user-dropdown">
                {['admin', 'receptionist', 'designer', 'worker', 'financial'].includes(user.role) && (
                  <Link to="/dashboard" className="nav-dropdown-item">
                    <span className="nav-dropdown-icon">📊</span>
                    ERP Dashboard
                  </Link>
                )}
                {user.role === 'client' && (
                  <Link to="/client-portal" className="nav-dropdown-item">
                    <span className="nav-dropdown-icon">👤</span>
                    Client Portal
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/website-settings" className="nav-dropdown-item">
                    <span className="nav-dropdown-icon">⚙️</span>
                    Website Settings
                  </Link>
                )}
                <button onClick={() => { logout(); navigate('/'); }} className="nav-dropdown-item logout-item">
                  <span className="nav-dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="nav-login-btn">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="hero-section"
        style={{
          backgroundImage: settings.hero.backgroundImage 
            ? `url(${settings.hero.backgroundImage}), linear-gradient(135deg, ${settings.branding.gradientStart}, ${settings.branding.gradientEnd})`
            : `linear-gradient(135deg, ${settings.branding.gradientStart}, ${settings.branding.gradientEnd})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">{settings.hero.title}</h1>
            <p className="hero-tagline">{settings.hero.tagline}</p>
            <a href={settings.hero.ctaLink} className="hero-cta-btn">
              {settings.hero.ctaText}
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">{settings.about.title}</h2>
          <div className="about-content">
            <p className="about-description">{settings.about.description}</p>
            <div className="about-values">
              <div className="value-card">
                <h3>🎯 Our Mission</h3>
                <p>{settings.about.mission}</p>
              </div>
              <div className="value-card">
                <h3>👁️ Our Vision</h3>
                <p>{settings.about.vision}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            {settings.services
              .filter((service) => service.isActive)
              .map((service, index) => (
                <div key={index} className="service-card">
                  {/* Background Image */}
                  {(service.image || service.icon) && (
                    <div className="service-card-image-wrapper">
                      {service.image ? (
                        <img src={service.image} alt={service.title} className="service-card-bg-image" />
                      ) : (
                        <div className="service-card-icon-bg">
                          <span className="service-emoji-large">{service.icon}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Content on Hover */}
                  <div className="service-card-content">
                    <div className="service-icon">
                      {service.icon && (
                        <span className="service-emoji">{service.icon}</span>
                      )}
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="why-choose-us-section">
        <div className="container">
          <h2 className="section-title">{settings.whyChooseUs.title}</h2>
          <div className="features-grid">
            {settings.whyChooseUs.features.map((feature, index) => (
              <div key={index} className="feature-card">
                {/* Background Image */}
                {(feature.image || feature.icon) && (
                  <div className="feature-card-image-wrapper">
                    {feature.image ? (
                      <img src={feature.image} alt={feature.title} className="feature-card-bg-image" />
                    ) : (
                      <div className="feature-card-icon-bg">
                        <span className="feature-emoji-large">{feature.icon}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Content on Hover */}
                <div className="feature-card-content">
                  <div className="feature-icon">
                    {feature.icon && (
                      <span className="feature-emoji">{feature.icon}</span>
                    )}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="portfolio-section">
        <div className="container">
          <h2 className="section-title">{settings.portfolio.title}</h2>
          {settings.portfolio.items.length > 0 ? (
            <div className="portfolio-grid">
              {settings.portfolio.items.map((item, index) => (
                <div key={index} className="portfolio-card">
                  {item.image && (
                    <img src={item.image} alt={item.title} />
                  )}
                  <div className="portfolio-info">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.category && (
                      <span className="portfolio-category">{item.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portfolio-placeholder">
              <p>Portfolio coming soon! We're working on showcasing our best projects.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Get In Touch</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <a href={`tel:${settings.contact.phone}`}>{settings.contact.phone}</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div>
                  <h4>WhatsApp</h4>
                  <a href={`https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}`}>
                    {settings.contact.whatsapp}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div>
                  <h4>Email</h4>
                  <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <h4>Address</h4>
                  <p>{settings.contact.address}</p>
                </div>
              </div>
            </div>
            <div className="contact-social">
              <h3>Follow Us</h3>
              <div className="social-links">
                {settings.contact.facebook && (
                  <a href={settings.contact.facebook} target="_blank" rel="noopener noreferrer">
                    <span className="social-icon">📘</span> Facebook
                  </a>
                )}
                {settings.contact.instagram && (
                  <a href={settings.contact.instagram} target="_blank" rel="noopener noreferrer">
                    <span className="social-icon">📷</span> Instagram
                  </a>
                )}
                {settings.contact.linkedin && (
                  <a href={settings.contact.linkedin} target="_blank" rel="noopener noreferrer">
                    <span className="social-icon">💼</span> LinkedIn
                  </a>
                )}
              </div>
              {settings.contact.qrCode && (
                <div className="qr-code">
                  <img src={settings.contact.qrCode} alt="QR Code" />
                  <p>Scan to connect</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="website-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Logo variant="full" size="medium" alt={settings.logo.altText} className="logo-svg" />
              <p>&copy; {new Date().getFullYear()} Sendroli Group. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

