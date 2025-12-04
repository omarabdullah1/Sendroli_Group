import { useEffect, useState } from 'react';
import CachedImage from '../components/CachedImage';
import PageLoader from '../components/PageLoader';
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

  // Utility function to fix old localhost URLs
  const fixImageUrl = (url) => {
    if (!url) return '';
    
    // If it's a localhost URL from old development data, return empty string
    // This will hide the broken image
    if (url.includes('localhost:5000') || url.includes('http://localhost')) {
      console.warn('Detected old localhost URL, hiding image:', url);
      return '';
    }
    
    return url;
  };

  // Recursively fix all image URLs in settings object
  const fixImageUrlsInSettings = (obj) => {
    if (!obj) return obj;
    
    const fixed = JSON.parse(JSON.stringify(obj)); // Deep clone
    
    const processObject = (item) => {
      if (typeof item === 'string' && (item.includes('localhost:5000') || item.includes('http://localhost'))) {
        return '';
      }
      
      if (typeof item === 'object' && item !== null) {
        if (Array.isArray(item)) {
          return item.map(processObject);
        } else {
          const processed = {};
          for (const [key, value] of Object.entries(item)) {
            // Common image field names
            if ((key === 'image' || key === 'backgroundImage' || key === 'icon' || key.includes('Image')) && 
                typeof value === 'string' && (value.includes('localhost:5000') || value.includes('http://localhost'))) {
              processed[key] = '';
              console.warn(`Fixed old localhost URL in ${key}:`, value);
            } else {
              processed[key] = processObject(value);
            }
          }
          return processed;
        }
      }
      
      return item;
    };
    
    return processObject(fixed);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await websiteService.getSettings();
      const rawSettings = response.data;
      
      // Fix old localhost URLs in the settings
      const fixedSettings = fixImageUrlsInSettings(rawSettings);
      setSettings(fixedSettings);
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
      console.log('💾 Saving settings:', settings);
      console.log('🖼️ Gallery data being saved:', settings.gallery);
      console.log('📊 Gallery items count:', settings.gallery?.items?.length || 0);
      
      const response = await websiteService.updateSettings(settings);
      
      console.log('✅ Save response:', response);
      console.log('📤 Response structure keys:', Object.keys(response || {}));
      console.log('🔍 Response.data keys:', Object.keys(response.data || {}));
      console.log('🖼️ Saved gallery data:', response.data?.gallery);
      console.log('📊 Response gallery items:', response.data?.gallery?.items?.length || 0);
      
      // Update settings with the saved data
      if (response.success && response.data) {
        setSettings(response.data);
      }
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('❌ Error updating settings:', error);
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
        // Check if it's already a data URL (base64)
        if (response.data.url.startsWith('data:')) {
          imageUrl = response.data.url;
        } else if (response.data.url.startsWith('http')) {
          imageUrl = response.data.url;
        } else {
          // Get the backend URL from API URL for relative paths
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const backendUrl = apiUrl.replace('/api', '');
          imageUrl = `${backendUrl}${response.data.url}`;
        }
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
      } else if (type === 'gallery') {
        const updatedItems = [...(settings.gallery?.items || [])];
        updatedItems[index].image = imageUrl;
        setSettings({
          ...settings,
          gallery: {
            ...settings.gallery,
            items: updatedItems,
          },
        });
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
    } else if (type === 'gallery') {
      const updatedItems = [...(settings.gallery?.items || [])];
      updatedItems[index].image = '';
      setSettings({
        ...settings,
        gallery: {
          ...settings.gallery,
          items: updatedItems,
        },
      });
    }
  };

  return (
    <PageLoader
      loading={loading}
      loadingMessage="Loading website settings..."
      onLoadComplete={() => console.log('Website settings loaded')}
    >
      <div className="website-settings-container">
        {!settings && !loading ? (
          <div className="error-message">Failed to load settings</div>
        ) : !isAdmin && !loading ? (
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>You don't have permission to access this page. Only administrators can modify website settings.</p>
          </div>
        ) : settings && !loading ? (
          <>
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
          className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
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
                {settings.hero.backgroundImage && settings.hero.backgroundImage.trim() !== '' && (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <span className="preview-label">Current:</span>
                      <CachedImage 
                        key={`hero-bg-${Date.now()}`}
                        src={settings.hero.backgroundImage} 
                        alt="Hero background preview"
                        className="preview-image"
                        onError={(e) => { 
                          console.error('Failed to load hero background image:', settings.hero.backgroundImage);
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
                        {service.image && service.image.trim() !== '' && (
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
                        {feature.image && feature.image.trim() !== '' && (
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

        {/* Gallery Section */}
        {activeTab === 'gallery' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Gallery</h2>
              <button onClick={() => {
                const newGalleryItem = {
                  title: 'New Gallery Item',
                  description: 'Image description',
                  image: '',
                  category: '',
                };
                const updatedItems = [...(settings.gallery?.items || []), newGalleryItem];
                setSettings({
                  ...settings,
                  gallery: {
                    ...settings.gallery,
                    items: updatedItems,
                  },
                });
              }} className="add-btn">
                + Add Gallery Item
              </button>
            </div>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={settings.gallery?.title || 'Our Gallery'}
                onChange={(e) => updateField('gallery', 'title', e.target.value)}
              />
            </div>
            <div className="services-list">
              {(settings.gallery?.items || []).map((item, index) => (
                <div key={index} className="service-item">
                  <div className="service-item-header">
                    <h3>Gallery Item #{index + 1}</h3>
                    <button
                      onClick={() => {
                        const updatedItems = (settings.gallery?.items || []).filter((_, i) => i !== index);
                        setSettings({
                          ...settings,
                          gallery: {
                            ...settings.gallery,
                            items: updatedItems,
                          },
                        });
                      }}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="form-group">
                    <label>
                      Image <span className="required-label">Required</span>
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
                            handleImageUpload(file, 'gallery', index);
                          }
                        }}
                        className="file-input"
                        id={`gallery-image-${index}`}
                        disabled={uploadingImages[`gallery-${index}`] || !isAdmin}
                      />
                      <label htmlFor={`gallery-image-${index}`} className={`file-input-label ${!isAdmin ? 'disabled' : ''}`}>
                        {uploadingImages[`gallery-${index}`] ? (
                          <span>Uploading...</span>
                        ) : !isAdmin ? (
                          <span>🔒 Admin Required</span>
                        ) : (
                          <span>📁 Choose Image</span>
                        )}
                      </label>
                      {item.image && item.image.trim() !== '' && (
                        <div className="image-preview-container">
                          <div className="image-preview">
                            <span className="preview-label">Current:</span>
                            <img 
                              key={`gallery-${index}-${Date.now()}`}
                              src={item.image} 
                              alt="Gallery preview" 
                              onError={(e) => { 
                                console.error('Failed to load gallery image:', item.image);
                                e.target.style.display = 'none'; 
                              }} 
                              onLoad={() => {
                                console.log('Gallery image loaded successfully:', item.image);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleImageRemove('gallery', index)}
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
                    <label>Title</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => {
                        const updatedItems = [...(settings.gallery?.items || [])];
                        updatedItems[index].title = e.target.value;
                        setSettings({
                          ...settings,
                          gallery: {
                            ...settings.gallery,
                            items: updatedItems,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description <span className="optional-label">Optional</span></label>
                    <textarea
                      rows="3"
                      value={item.description || ''}
                      onChange={(e) => {
                        const updatedItems = [...(settings.gallery?.items || [])];
                        updatedItems[index].description = e.target.value;
                        setSettings({
                          ...settings,
                          gallery: {
                            ...settings.gallery,
                            items: updatedItems,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category <span className="optional-label">Optional</span></label>
                    <input
                      type="text"
                      value={item.category || ''}
                      onChange={(e) => {
                        const updatedItems = [...(settings.gallery?.items || [])];
                        updatedItems[index].category = e.target.value;
                        setSettings({
                          ...settings,
                          gallery: {
                            ...settings.gallery,
                            items: updatedItems,
                          },
                        });
                      }}
                      placeholder="e.g., Digital Printing, Vinyl, Laser Cutting"
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
            
            <h3 style={{color: '#FFD700', marginTop: '2rem', marginBottom: '1rem'}}>Map Configuration</h3>
            <div className="form-group">
              <label>Map Location Name</label>
              <input
                type="text"
                value={settings.contact.mapLocation || settings.contact.address || 'Cairo, Egypt'}
                onChange={(e) => updateField('contact', 'mapLocation', e.target.value)}
                placeholder="e.g., Cairo, Egypt"
              />
              <small className="form-hint">This text will be displayed above the map</small>
            </div>
            <div className="form-group">
              <label>Google Maps Embed URL</label>
              <textarea
                rows="3"
                value={settings.contact.mapEmbedUrl || ''}
                onChange={(e) => updateField('contact', 'mapEmbedUrl', e.target.value)}
                placeholder="Paste the embed URL from Google Maps (Share → Embed a map)"
              />
              <small className="form-hint">
                To get this URL: Go to Google Maps → Search for your location → Click "Share" → Choose "Embed a map" → Copy the src URL
              </small>
            </div>
            
            <h3 style={{color: '#FFD700', marginTop: '2rem', marginBottom: '1rem'}}>Social Media</h3>
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
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={settings.contact.linkedin || ''}
                onChange={(e) => updateField('contact', 'linkedin', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>QR Code Image</label>
              <ImageUpload
                currentImage={settings.contact.qrCode}
                onImageChange={(imageUrl) => updateField('contact', 'qrCode', imageUrl)}
                onImageRemove={() => updateField('contact', 'qrCode', '')}
                acceptedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                placeholder="Upload QR code for quick contact"
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
          </>
        ) : null}
      </div>
    </PageLoader>
  );
};

export default WebsiteSettings;

