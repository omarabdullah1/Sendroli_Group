import { useEffect, useRef, useState } from 'react';
import imageCache from '../utils/imageCache';
import './CachedImage.css';
import LottieLoader from './LottieLoader/LottieLoader';

const CachedImage = ({ 
  src, 
  alt, 
  className = '', 
  onLoad, 
  onError,
  placeholder = null,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    // Check if image is already cached
    if (imageCache.isCached(src)) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Preload and cache the image
    const loadImage = async () => {
      try {
        await imageCache.preload(src);
        setImageSrc(src);
        setLoading(false);
        if (onLoad) onLoad();
      } catch (err) {
        console.warn('Failed to load image:', src, err);
        setError(true);
        setLoading(false);
        if (onError) onError(err);
      }
    };

    loadImage();
  }, [src, onLoad, onError]);

  if (loading) {
    return placeholder || (
      <div className={`cached-image-placeholder ${className}`}>
        <LottieLoader size="small" message="" showMessage={false} />
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={`cached-image-error ${className}`}>
        <span className="image-error-icon">📷</span>
        <span className="image-error-text">Image not available</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`cached-image ${className}`}
      onError={(e) => {
        setError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

export default CachedImage;