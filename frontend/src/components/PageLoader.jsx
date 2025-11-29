import { useEffect, useState } from 'react';
import imageCache from '../utils/imageCache';
import Loading from './Loading/Loading';

/**
 * PageLoader - Wrapper component for page-level loading with image preloading
 * Handles loading states and preloads critical images
 */
const PageLoader = ({ 
  children, 
  loading = false,
  loadingMessage = 'Loading...',
  preloadImages = [],
  minLoadTime = 500, // Minimum loading time to prevent flash
  onLoadComplete
}) => {
  const [isLoading, setIsLoading] = useState(loading);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!loading) return;

    const handleLoading = async () => {
      try {
        // Preload images if provided
        if (preloadImages.length > 0) {
          await imageCache.preloadBatch(preloadImages);
        }

        // Ensure minimum loading time to prevent flash
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadTime) {
          await new Promise(resolve => 
            setTimeout(resolve, minLoadTime - elapsedTime)
          );
        }

        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      } catch (error) {
        console.warn('Page loading completed with some errors:', error);
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete(error);
        }
      }
    };

    handleLoading();
  }, [loading, preloadImages, minLoadTime, onLoadComplete, startTime]);

  if (isLoading) {
    return (
      <Loading
        size="large"
        message={loadingMessage}
        fullScreen={true}
      />
    );
  }

  return children;
};

export default PageLoader;