import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import websiteService from '../services/websiteService';
import './WebsiteSettings.css';

const WebsiteSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('hero');
  const [uploadingImages, setUploadingImages] = useState({});

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await websiteService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load website settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await websiteService.updateSettings(settings);
      setSettings(response.data);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const updateNestedField = (section, subsection, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [subsection]: {
          ...settings[section][subsection],
          [field]: value,
        },
      },
    });
  };

  const addService = () => {
    const newService = {
      title: 'New Service',
      description: 'Service description',
      icon: '🎨',
      image: '',
      isActive: true,
    };
    setSettings({
      ...settings,
      services: [...settings.services, newService],
    });
  };

  const updateService = (index, field, value) => {
    const updatedServices = [...settings.services];
    updatedServices[index][field] = value;
    setSettings({
      ...settings,
      services: updatedServices,
    });
  };

  const deleteService = (index) => {
    const updatedServices = settings.services.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      services: updatedServices,
    });
  };

  const handleImageUpload = async (file, type, index) => {
    // Check if user is admin before proceeding
    if (!isAdmin) {
      setMessage({ 
        type: 'error', 
        text: 'Only administrators can upload images. Please login as admin.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a valid image file (JPG, PNG, GIF, WebP, SVG).' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ 
        type: 'error', 
        text: 'Image size must be less than 5MB.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    const uploadKey = `${type}-${index}`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const response = await websiteService.uploadImage(file);
      console.log('Upload response:', response);
      
      // Construct the image URL properly
      let imageUrl;
      if (response.data.fullUrl && response.data.fullUrl.startsWith('http')) {
        imageUrl = response.data.fullUrl;
      } else if (response.data.url) {
        // Get the backend URL from API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const backendUrl = apiUrl.replace('/api', '');
        imageUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${backendUrl}${response.data.url}`;
      } else {
        throw new Error('Invalid upload response: no URL provided');
      }
      
      console.log('Constructed image URL:', imageUrl);
      
      if (type === 'service') {
        updateService(index, 'image', imageUrl);
      } else if (type === 'feature') {
        const updatedFeatures = [...settings.whyChooseUs.features];
        updatedFeatures[index].image = imageUrl;
        setSettings({
          ...settings,
          whyChooseUs: {
            ...settings.whyChooseUs,
            features: updatedFeatures,
          },
        });
      } else if (type === 'hero') {
        console.log('Updating hero background image to:', imageUrl);
        updateField('hero', 'backgroundImage', imageUrl);
        console.log('Hero background image updated in state');
      }
      
      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload image';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login as admin to upload images';
      } else if (error.response?.status === 403) {
        errorMessage = 'Only administrators can upload images';
      } else if (error.response?.status === 404) {
        errorMessage = 'Upload service not available. Please contact support.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000); // Show error longer
    } finally {
      setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleImageRemove = (type, index) => {
    if (type === 'service') {
      updateService(index, 'image', '');
    } else if (type === 'feature') {
      const updatedFeatures = [...settings.whyChooseUs.features];
      updatedFeatures[index].image = '';
      setSettings({
        ...settings,
        whyChooseUs: {
          ...settings.whyChooseUs,
          features: updatedFeatures,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="website-settings-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="website-settings-container">
        <div className="error-message">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="website-settings-container">
      <div className="settings-header">
        <h1>Website Settings</h1>
        <p>Manage your public website content and appearance</p>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'hero' ? 'active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          Hero Section
        </button>
        <button
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button
          className={`tab-btn ${activeTab === 'why-choose-us' ? 'active' : ''}`}
          onClick={() => setActiveTab('why-choose-us')}
        >
          Why Choose Us
        </button>
        <button
          className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact
        </button>
        <button
          className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </button>
        <button
          className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO
        </button>
      </div>

      <div className="settings-content">
        {/* Hero Section */}
        {activeTab === 'hero' && (
          <div className="settings-section">
            <h2>Hero Section</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={settings.hero.title}
                onChange={(e) => updateField('hero', 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                value={settings.hero.tagline}
                onChange={(e) => updateField('hero', 'tagline', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>
                Background Image <span className="optional-label">Optional</span>
                {!isAdmin && <span className="admin-only-label"> (Admin Only)</span>}
              </label>
              {!isAdmin && (
                <div className="admin-notice">
                  <span>⚠️ Only administrators can upload images</span>
                </div>
              )}
              <div className="image-upload-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file, 'hero', 0);
                    }
                  }}
                  className="file-input"
                  id="hero-background-image"
                  disabled={uploadingImages['hero-0'] || !isAdmin}
                />
                <label htmlFor="hero-background-image" className={`file-input-label ${!isAdmin ? 'disabled' : ''}`}>
                  {uploadingImages['hero-0'] ? (
                    <span>Uploading...</span>
                  ) : !isAdmin ? (
                    <span>🔒 Admin Required</span>
                  ) : (
                    <span>📁 Choose Background Image</span>
                  )}
                </label>
                {settings.hero.backgroundImage && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <span className="preview-label">Current:</span>
                      <img 
                        key={`hero-bg-${Date.now()}`}
                        src={settings.hero.backgroundImage} 
                        alt="Hero background preview" 
                        onError={(e) => { 
                          console.error('Failed to load hero background image:', settings.hero.backgroundImage);
                          e.target.style.display = 'none'; 
                        }} 
                        onLoad={() => {
                          console.log('Hero background image loaded successfully:', settings.hero.backgroundImage);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updateField('hero', 'backgroundImage', '')}
                        className="remove-image-btn"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>CTA Button Text</label>
              <input
                type="text"
                value={settings.hero.ctaText}
                onChange={(e) => updateField('hero', 'ctaText', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>CTA Button Link</label>
              <input
                type="text"
                value={settings.hero.ctaLink}
                onChange={(e) => updateField('hero', 'ctaLink', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* About Section */}
        {activeTab === 'about' && (
          <div className="settings-section">
            <h2>About Section</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={settings.about.title}
                onChange={(e) => updateField('about', 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="5"
                value={settings.about.description}
                onChange={(e) => updateField('about', 'description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mission</label>
              <textarea
                rows="3"
                value={settings.about.mission}
                onChange={(e) => updateField('about', 'mission', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vision</label>
              <textarea
                rows="3"
                value={settings.about.vision}
                onChange={(e) => updateField('about', 'vision', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Services Section */}
        {activeTab === 'services' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Services</h2>
              <button onClick={addService} className="add-btn">
                + Add Service
              </button>
            </div>
            <div className="services-list">
              {settings.services.map((service, index) => (
                <div key={index} className="service-item">
                  <div className="service-item-header">
                    <h3>Service #{index + 1}</h3>
                    <button
                      onClick={() => deleteService(index)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="icon-image-section">
                    <div className="form-group">
                      <label>
                        Icon (Emoji) <span className="optional-label">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={service.icon || ''}
                        onChange={(e) => updateService(index, 'icon', e.target.value)}
                        placeholder="🎨"
                      />
                      {service.icon && (
                        <div className="icon-preview">
                          <span className="preview-label">Preview:</span>
                          <span className="preview-icon">{service.icon}</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        Image <span className="optional-label">Optional</span>
                        {!isAdmin && <span className="admin-only-label"> (Admin Only)</span>}
                      </label>
                      {!isAdmin && (
                        <div className="admin-notice">
                          <span>⚠️ Only administrators can upload images</span>
                        </div>
                      )}
                      <div className="image-upload-wrapper">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImageUpload(file, 'service', index);
                            }
                          }}
                          className="file-input"
                          id={`service-image-${index}`}
                          disabled={uploadingImages[`service-${index}`] || !isAdmin}
                        />
                        <label htmlFor={`service-image-${index}`} className={`file-input-label ${!isAdmin ? 'disabled' : ''}`}>
                          {uploadingImages[`service-${index}`] ? (
                            <span>Uploading...</span>
                          ) : !isAdmin ? (
                            <span>🔒 Admin Required</span>
                          ) : (
                            <span>📁 Choose Image</span>
                          )}
                        </label>
                        {service.image && (
                          <div className="image-preview-container">
                            <div className="image-preview">
                              <span className="preview-label">Current:</span>
                              <img 
                                key={`service-${index}-${Date.now()}`}
                                src={service.image} 
                                alt="Service preview" 
                                onError={(e) => { 
                                  console.error('Failed to load image:', service.image);
                                  e.target.style.display = 'none'; 
                                }} 
                                onLoad={() => {
                                  console.log('Image loaded successfully:', service.image);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleImageRemove('service', index)}
                                className="remove-image-btn"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="info-label">
                        💡 Tip: Use either an icon (emoji) or an image. If both are provided, the image will be used.
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={service.title}
                      onChange={(e) => updateService(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={service.isActive}
                        onChange={(e) => updateService(index, 'isActive', e.target.checked)}
                      />
                      Active
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why Choose Us Section */}
        {activeTab === 'why-choose-us' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Why Choose Us</h2>
              <button onClick={() => {
                const updatedFeatures = [...settings.whyChooseUs.features, {
                  title: 'New Feature',
                  description: 'Feature description',
                  icon: '⭐',
                  image: '',
                }];
                setSettings({
                  ...settings,
                  whyChooseUs: {
                    ...settings.whyChooseUs,
                    features: updatedFeatures,
                  },
                });
              }} className="add-btn">
                + Add Feature
              </button>
            </div>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={settings.whyChooseUs.title}
                onChange={(e) => updateField('whyChooseUs', 'title', e.target.value)}
              />
            </div>
            <div className="services-list">
              {settings.whyChooseUs.features.map((feature, index) => (
                <div key={index} className="service-item">
                  <div className="service-item-header">
                    <h3>Feature #{index + 1}</h3>
                    <button
                      onClick={() => {
                        const updatedFeatures = settings.whyChooseUs.features.filter((_, i) => i !== index);
                        setSettings({
                          ...settings,
                          whyChooseUs: {
                            ...settings.whyChooseUs,
                            features: updatedFeatures,
                          },
                        });
                      }}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="icon-image-section">
                    <div className="form-group">
                      <label>
                        Icon (Emoji) <span className="optional-label">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={feature.icon || ''}
                        onChange={(e) => {
                          const updatedFeatures = [...settings.whyChooseUs.features];
                          updatedFeatures[index].icon = e.target.value;
                          setSettings({
                            ...settings,
                            whyChooseUs: {
                              ...settings.whyChooseUs,
                              features: updatedFeatures,
                            },
                          });
                        }}
                        placeholder="⭐"
                      />
                      {feature.icon && (
                        <div className="icon-preview">
                          <span className="preview-label">Preview:</span>
                          <span className="preview-icon">{feature.icon}</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        Image <span className="optional-label">Optional</span>
                        {!isAdmin && <span className="admin-only-label"> (Admin Only)</span>}
                      </label>
                      {!isAdmin && (
                        <div className="admin-notice">
                          <span>⚠️ Only administrators can upload images</span>
                        </div>
                      )}
                      <div className="image-upload-wrapper">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImageUpload(file, 'feature', index);
                            }
                          }}
                          className="file-input"
                          id={`feature-image-${index}`}
                          disabled={uploadingImages[`feature-${index}`] || !isAdmin}
                        />
                        <label htmlFor={`feature-image-${index}`} className={`file-input-label ${!isAdmin ? 'disabled' : ''}`}>
                          {uploadingImages[`feature-${index}`] ? (
                            <span>Uploading...</span>
                          ) : !isAdmin ? (
                            <span>🔒 Admin Required</span>
                          ) : (
                            <span>📁 Choose Image</span>
                          )}
                        </label>
                        {feature.image && (
                          <div className="image-preview-container">
                            <div className="image-preview">
                              <span className="preview-label">Current:</span>
                              <img 
                                key={`feature-${index}-${Date.now()}`}
                                src={feature.image} 
                                alt="Feature preview" 
                                onError={(e) => { 
                                  console.error('Failed to load feature image:', feature.image);
                                  e.target.style.display = 'none'; 
                                }} 
                                onLoad={() => {
                                  console.log('Feature image loaded successfully:', feature.image);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleImageRemove('feature', index)}
                                className="remove-image-btn"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="info-label">
                        💡 Tip: Use either an icon (emoji) or an image. If both are provided, the image will be used.
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => {
                        const updatedFeatures = [...settings.whyChooseUs.features];
                        updatedFeatures[index].title = e.target.value;
                        setSettings({
                          ...settings,
                          whyChooseUs: {
                            ...settings.whyChooseUs,
                            features: updatedFeatures,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows="3"
                      value={feature.description}
                      onChange={(e) => {
                        const updatedFeatures = [...settings.whyChooseUs.features];
                        updatedFeatures[index].description = e.target.value;
                        setSettings({
                          ...settings,
                          whyChooseUs: {
                            ...settings.whyChooseUs,
                            features: updatedFeatures,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeTab === 'contact' && (
          <div className="settings-section">
            <h2>Contact Information</h2>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={settings.contact.phone}
                onChange={(e) => updateField('contact', 'phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="text"
                value={settings.contact.whatsapp}
                onChange={(e) => updateField('contact', 'whatsapp', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={settings.contact.email}
                onChange={(e) => updateField('contact', 'email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={settings.contact.address}
                onChange={(e) => updateField('contact', 'address', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Facebook URL</label>
              <input
                type="url"
                value={settings.contact.facebook}
                onChange={(e) => updateField('contact', 'facebook', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input
                type="url"
                value={settings.contact.instagram || ''}
                onChange={(e) => updateField('contact', 'instagram', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Branding Section */}
        {activeTab === 'branding' && (
          <div className="settings-section">
            <h2>Brand Colors</h2>
            <div className="color-grid">
              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.branding.primaryColor}
                    onChange={(e) => updateField('branding', 'primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.branding.primaryColor}
                    onChange={(e) => updateField('branding', 'primaryColor', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Secondary Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.branding.secondaryColor}
                    onChange={(e) => updateField('branding', 'secondaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.branding.secondaryColor}
                    onChange={(e) => updateField('branding', 'secondaryColor', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Accent Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={settings.branding.accentColor}
                    onChange={(e) => updateField('branding', 'accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={settings.branding.accentColor}
                    onChange={(e) => updateField('branding', 'accentColor', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Gradient Start Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={settings.branding.gradientStart}
                  onChange={(e) => updateField('branding', 'gradientStart', e.target.value)}
                />
                <input
                  type="text"
                  value={settings.branding.gradientStart}
                  onChange={(e) => updateField('branding', 'gradientStart', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Gradient End Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={settings.branding.gradientEnd}
                  onChange={(e) => updateField('branding', 'gradientEnd', e.target.value)}
                />
                <input
                  type="text"
                  value={settings.branding.gradientEnd}
                  onChange={(e) => updateField('branding', 'gradientEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* SEO Section */}
        {activeTab === 'seo' && (
          <div className="settings-section">
            <h2>SEO Settings</h2>
            <div className="form-group">
              <label>Meta Title</label>
              <input
                type="text"
                value={settings.seo.metaTitle}
                onChange={(e) => updateField('seo', 'metaTitle', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea
                rows="3"
                value={settings.seo.metaDescription}
                onChange={(e) => updateField('seo', 'metaDescription', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Keywords (comma-separated)</label>
              <input
                type="text"
                value={settings.seo.keywords.join(', ')}
                onChange={(e) =>
                  updateField('seo', 'keywords', e.target.value.split(',').map((k) => k.trim()))
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button
          onClick={handleSave}
          className="save-btn"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="preview-btn"
        >
          Preview Website
        </a>
      </div>
    </div>
  );
};

export default WebsiteSettings;

