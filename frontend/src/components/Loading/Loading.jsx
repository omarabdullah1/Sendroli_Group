import React from 'react';
import Lottie from 'lottie-react';
import businessDealAnimation from '../../../assets/lottie/Business_deal.json';
import './Loading.css';

/**
 * Unified Loading Component
 * Uses Lottie animation from Business_deal.json with theme colors
 * 
 * @param {string} size - Size of the loading animation: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} message - Optional loading message to display below the animation
 * @param {boolean} fullScreen - Whether to display as full screen overlay (default: false)
 * @param {string} className - Additional CSS classes
 */
const Loading = ({ 
  size = 'medium', 
  message = null, 
  fullScreen = false,
  className = '' 
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

