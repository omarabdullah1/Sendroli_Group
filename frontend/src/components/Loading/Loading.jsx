import Lottie from 'lottie-react';
import businessDealAnimation from '../../../assets/lottie/Business_deal.json';
import LottieLoader from '../LottieLoader/LottieLoader';
import './Loading.css';

/**
 * Unified Loading Component
 * Uses Lottie animation from Business_deal.json with theme colors
 * Falls back to simple loading if business animation fails
 * 
 * @param {string} size - Size of the loading animation: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} message - Optional loading message to display below the animation
 * @param {boolean} fullScreen - Whether to display as full screen overlay (default: false)
 * @param {string} className - Additional CSS classes
 * @param {boolean} useFallback - Force use of fallback loader (default: false)
 */
const Loading = ({ 
  size = 'medium', 
  message = null, 
  fullScreen = false,
  className = '',
  useFallback = false
}) => {
  // Define size mappings
  const sizeMap = {
    small: '120px',
    medium: '200px',
    large: '300px'
  };

  const animationSize = sizeMap[size] || sizeMap.medium;

  const animationStyle = {
    width: animationSize,
    height: animationSize,
  };

  const containerClass = `loading-container ${fullScreen ? 'loading-fullscreen' : ''} ${className}`.trim();

  // Use fallback loader if requested or business animation not available
  if (useFallback || !businessDealAnimation) {
    return (
      <LottieLoader 
        size={size}
        message={message}
        fullScreen={fullScreen}
        className={className}
        showMessage={!!message}
      />
    );
  }

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className="loading-animation-wrapper">
          <Lottie
            animationData={businessDealAnimation}
            loop={true}
            autoplay={true}
            style={animationStyle}
            className="loading-lottie"
            onLoadedData={() => console.log('Business animation loaded')}
            onError={() => {
              console.warn('Business animation failed, using fallback');
            }}
          />
        </div>
        {message && (
          <p className="loading-message">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Loading;

