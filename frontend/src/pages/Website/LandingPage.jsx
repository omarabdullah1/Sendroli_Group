import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CachedImage from '../../components/CachedImage';
import Logo from '../../components/Logo';
import PageLoader from '../../components/PageLoader';
import { useAuth } from '../../context/AuthContext';
import websiteService from '../../services/websiteService';
import imageCache from '../../utils/imageCache';
import './LandingPage.css';

// Fallback data when API is not available
const fallbackSettings = {
  logo: {
    altText: 'Sendroli Factory'
  },
  branding: {
    gradientStart: '#1976d2',
    gradientEnd: '#42a5f5'
  },
  hero: {
    title: 'Sendroli Factory Management',
    subtitle: 'Professional Manufacturing Solutions',
    description: 'Leading provider of high-quality manufacturing and printing services with state-of-the-art technology and exceptional customer service.',
    ctaText: 'Get Started',
    ctaLink: '#contact'
  },
  about: {
    title: 'About Sendroli Factory',
    description: 'We are a premier manufacturing company specializing in high-quality production services. Our experienced team and modern equipment ensure exceptional results for all your manufacturing needs.',
    mission: 'To provide exceptional manufacturing solutions with quality and precision.',
    vision: 'To be the leading manufacturing partner for businesses worldwide.',
    features: [
      { icon: '⚡', title: 'Fast Production', description: 'Quick turnaround times without compromising quality' },
      { icon: '🎯', title: 'Precision Quality', description: 'State-of-the-art equipment for perfect results' },
      { icon: '🤝', title: 'Customer Focus', description: 'Dedicated support throughout your project' }
    ]
  },
  whyChooseUs: {
    title: 'Why Choose Us',
    features: [
      { icon: '⚡', title: 'Fast Production', description: 'Quick turnaround times without compromising quality' },
      { icon: '🎯', title: 'Precision Quality', description: 'State-of-the-art equipment for perfect results' },
      { icon: '🤝', title: 'Customer Focus', description: 'Dedicated support throughout your project' }
    ]
  },
  services: [
    {
      _id: '1',
      title: 'Digital Printing',
      description: 'High-quality digital printing services for business cards, brochures, and marketing materials.',
      icon: '🖨️'
    },
    {
      _id: '2', 
      title: 'Custom Manufacturing',
      description: 'Custom manufacturing solutions tailored to your specific requirements.',
      icon: '⚙️'
    },
    {
      _id: '3',
      title: 'Quality Assurance',
      description: 'Rigorous quality control processes to ensure exceptional results.',
      icon: '✅'
    }
  ],
  gallery: {
    title: 'Our Gallery',
    items: []
  },
  contact: {
    title: 'Get In Touch',
    description: 'Ready to start your next project? Contact us today for a consultation.',
    email: 'info@sendrolifactory.com',
    phone: '+20 123 456 7890',
    address: 'Cairo, Egypt'
  }
};

const LandingPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preloadingImages, setPreloadingImages] = useState(false);

  // Utility function to check if image URL is valid
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Skip localhost URLs from old development data
    if (url.includes('localhost:5000') || url.includes('http://localhost')) {
      console.warn('Skipping old localhost image URL:', url);
      return false;
    }
    
    // Check for data URLs or valid HTTP/HTTPS URLs
    return url.startsWith('data:') || 
           url.startsWith('https://') || 
           url.startsWith('http://') ||
           url.startsWith('/');
  };

  useEffect(() => {
    // Start with fallback data, then try to load from API
    setSettings(fallbackSettings);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await websiteService.getSettings();
      if (response && response.data) {
        console.log('🔍 Settings fetched:', response.data);
        console.log('🖼️ Gallery data:', response.data.gallery);
        console.log('📊 Gallery items count:', response.data.gallery?.items?.length || 0);
        setSettings(response.data);
        setError(null);
        
        // Preload critical images
        await preloadCriticalImages(response.data);
      } else {
        throw new Error('No data received');
      }
    } catch (error) {
      console.warn('API not available, using fallback data:', error);
      setError('API not available - showing demo content');
      
      // Still preload fallback images
      await preloadCriticalImages(fallbackSettings);
    } finally {
      setLoading(false);
    }
  };

  const preloadCriticalImages = async (settingsData) => {
    setPreloadingImages(true);
    try {
      const imagesToPreload = [];
      
      // Collect critical images
      if (settingsData.hero?.backgroundImage) {
        imagesToPreload.push(settingsData.hero.backgroundImage);
      }
      
      // Collect service images
      if (settingsData.services) {
        settingsData.services.forEach(service => {
          if (service.image && isValidImageUrl(service.image)) {
            imagesToPreload.push(service.image);
          }
        });
      }
      
      // Collect feature images
      if (settingsData.whyChooseUs?.features) {
        settingsData.whyChooseUs.features.forEach(feature => {
          if (feature.image && isValidImageUrl(feature.image)) {
            imagesToPreload.push(feature.image);
          }
        });
      }
      
      // Collect gallery images (first 6 for performance)
      if (settingsData.gallery?.items) {
        settingsData.gallery.items.slice(0, 6).forEach(item => {
          if (item.image && isValidImageUrl(item.image)) {
            imagesToPreload.push(item.image);
          }
        });
      }
      
      if (imagesToPreload.length > 0) {
        await imageCache.preloadBatch(imagesToPreload);
        console.log(`Preloaded ${imagesToPreload.length} images`);
      }
    } catch (error) {
      console.warn('Error preloading images:', error);
    } finally {
      setPreloadingImages(false);
    }
  };

  // Always show content, either from API or fallback
  const currentSettings = settings || fallbackSettings;

  return (
    <PageLoader
      loading={loading || preloadingImages}
      loadingMessage={preloadingImages ? "Loading images..." : "Loading..."}
      onLoadComplete={() => console.log('LandingPage loaded completely')}
    >
      <div className="landing-page">
        {/* Error banner for development */}
        {error && process.env.NODE_ENV === 'development' && (
          <div className="error-banner" style={{background: '#fff3cd', padding: '10px', textAlign: 'center', fontSize: '14px', color: '#856404'}}>
            ⚠️ {error}
          </div>
        )}
      
      {/* Navigation */}
      <nav className="website-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Logo variant="full" size="medium" alt={currentSettings.logo.altText} className="logo-svg" />
          </div>
          <ul className="nav-links">
            <li><a href="#hero">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#why-choose-us">Why Us</a></li>
            {settings.gallery?.items && settings.gallery.items.length > 0 && (
              <li><a href="#gallery">Gallery</a></li>
            )}
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
          backgroundImage: currentSettings.hero?.backgroundImage && isValidImageUrl(currentSettings.hero.backgroundImage)
            ? `url(${currentSettings.hero.backgroundImage}), linear-gradient(135deg, ${currentSettings.branding?.gradientStart || '#1976d2'}, ${currentSettings.branding?.gradientEnd || '#42a5f5'})`
            : `linear-gradient(135deg, ${currentSettings.branding?.gradientStart || '#1976d2'}, ${currentSettings.branding?.gradientEnd || '#42a5f5'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">{currentSettings.hero?.title || 'Sendroli Factory Management'}</h1>
            <p className="hero-tagline">{currentSettings.hero?.subtitle || 'Professional Manufacturing Solutions'}</p>
            <a href={currentSettings.hero?.ctaLink || '#contact'} className="hero-cta-btn">
              {currentSettings.hero?.ctaText || 'Get Started'}
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">{currentSettings.about?.title || 'About Us'}</h2>
          <div className="about-content">
            <p className="about-description">{currentSettings.about?.description || 'We are a premier manufacturing company.'}</p>
            <div className="about-values">
              <div className="value-card">
                <h3>Our Mission</h3>
                <p>{currentSettings.about?.mission || 'To provide exceptional manufacturing solutions with quality and precision.'}</p>
              </div>
              <div className="value-card">
                <h3>Our Vision</h3>
                <p>{currentSettings.about?.vision || 'To be the leading manufacturing partner for businesses worldwide.'}</p>
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
            {(currentSettings.services || [])
              .filter((service) => service.isActive !== false)
              .map((service, index) => (
                <div key={service._id || index} className="service-card">
                  {/* Background Image */}
                  {(service.image || service.icon) && (
                    <div className="service-card-image-wrapper">
                      {service.image && isValidImageUrl(service.image) ? (
                        <CachedImage 
                          src={service.image} 
                          alt={service.title} 
                          className="service-card-bg-image"
                        />
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
          <h2 className="section-title">{currentSettings.whyChooseUs?.title || 'Why Choose Us'}</h2>
          <div className="features-grid">
            {(currentSettings.about?.features || currentSettings.whyChooseUs?.features || []).map((feature, index) => (
              <div key={index} className="feature-card">
                {/* Background Image */}
                {(feature.image || feature.icon) && (
                  <div className="feature-card-image-wrapper">
                    {feature.image && isValidImageUrl(feature.image) ? (
                      <CachedImage 
                        src={feature.image} 
                        alt={feature.title} 
                        className="feature-card-bg-image"
                      />
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

      {/* Gallery Section - Horizontal Sliding Gallery */}
      {(() => {
        const hasGalleryItems = settings.gallery?.items && settings.gallery.items.length > 0;
        console.log('🎨 Gallery render check:', {
          hasGallery: !!settings.gallery,
          hasItems: !!settings.gallery?.items,
          itemsLength: settings.gallery?.items?.length || 0,
          willRender: hasGalleryItems,
          items: settings.gallery?.items
        });
        return hasGalleryItems;
      })() && (
        <section id="gallery" className="gallery-section">
          <div className="container">
            <h2 className="section-title">{settings.gallery?.title || 'Our Gallery'}</h2>
            <div className="gallery-slider-container">
              <div className="gallery-slider">
                {settings.gallery.items.map((item, index) => {
                  console.log(`🖼️ Rendering gallery item ${index}:`, {
                    title: item.title,
                    hasImage: !!item.image,
                    imageUrl: item.image,
                    isValid: item.image ? isValidImageUrl(item.image) : false
                  });
                  return (
                    <div key={index} className="gallery-slide">
                      <div className="gallery-card">
                        {item.image && isValidImageUrl(item.image) ? (
                          <CachedImage src={item.image} alt={item.title || 'Gallery image'} className="gallery-image" />
                        ) : (
                          <div className="gallery-placeholder">
                            {item.image ? '❌ Invalid image' : '📷 No image'}
                          </div>
                        )}
                        <div className="gallery-overlay">
                          <div className="gallery-info">
                            {item.title && <h3>{item.title}</h3>}
                            {item.description && <p>{item.description}</p>}
                            {item.category && (
                              <span className="gallery-category">{item.category}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Get In Touch</h2>
          <div className="contact-content">
            {/* Contact Info and Social Side by Side */}
            <div className="contact-left">
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h4>Phone</h4>
                    <a href={`tel:${currentSettings.contact?.phone || '+20 123 456 7890'}`}>{currentSettings.contact?.phone || '+20 123 456 7890'}</a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">💬</div>
                  <div>
                    <h4>WhatsApp</h4>
                    <a href={`https://wa.me/${(currentSettings.contact?.whatsapp || '+20 123 456 7890').replace(/[^0-9]/g, '')}`}>
                      {currentSettings.contact?.whatsapp || '+20 123 456 7890'}
                    </a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <h4>Email</h4>
                    <a href={`mailto:${currentSettings.contact?.email || 'info@sendrolifactory.com'}`}>{currentSettings.contact?.email || 'info@sendrolifactory.com'}</a>
                  </div>
                </div>
              </div>
              
              <div className="contact-social">
                <h3>Follow Us</h3>
                <div className="social-links">
                  {currentSettings.contact?.facebook && (
                    <a href={currentSettings.contact.facebook} target="_blank" rel="noopener noreferrer">
                      <span className="social-icon">👥</span> Facebook
                    </a>
                  )}
                  {currentSettings.contact?.instagram && (
                    <a href={currentSettings.contact.instagram} target="_blank" rel="noopener noreferrer">
                      <span className="social-icon">📷</span> Instagram
                    </a>
                  )}
                  {currentSettings.contact?.linkedin && (
                    <a href={currentSettings.contact.linkedin} target="_blank" rel="noopener noreferrer">
                      <span className="social-icon">💼</span> LinkedIn
                    </a>
                  )}
                </div>
                {currentSettings.contact?.qrCode && (
                  <div className="qr-code">
                  {currentSettings.contact.qrCode && isValidImageUrl(currentSettings.contact.qrCode) && (
                    <CachedImage 
                      src={currentSettings.contact.qrCode} 
                      alt="QR Code" 
                      className="qr-code-image"
                    />
                  )}
                    <p>Scan to connect</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Interactive Map - Right Side */}
            <div className="contact-map">
              <h3>{currentSettings.contact?.mapLocation || 'Find Us'}</h3>
              <div className="map-container">
                <iframe
                  src={currentSettings.contact?.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d220790.48587489217!2d31.04534893359375!3d30.064742000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60b21beeb%3A0x79dfb296e8423bba!2sCairo%2C%20Egypt!5e0!3m2!1sen!2sus!4v1701234567890!5m2!1sen!2sus"}
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '10px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${currentSettings.contact?.mapLocation || 'Company'} Location`}
                ></iframe>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="website-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Logo variant="full" size="medium" alt={currentSettings.logo?.altText || 'Sendroli Factory'} className="logo-svg" />
              <p>&copy; {new Date().getFullYear()} Sendroli Group. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </PageLoader>
  );
};

export default LandingPage;

