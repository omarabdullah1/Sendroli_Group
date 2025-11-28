import './Logo.css';

const Logo = ({ 
  variant = 'full', // 'full', 'icon', 'text'
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
  alt = 'Sendroli Group Logo',
  onClick 
}) => {
  const getLogoContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className={`logo-icon ${size} ${className}`} onClick={onClick}>
            <img 
              src="/assets/logo-icon.svg" 
              alt={alt}
              className="logo-svg"
            />
          </div>
        );

      case 'text':
        return (
          <div className={`logo-text ${size} ${className}`} onClick={onClick}>
            <img 
              src="/assets/logo-text.svg" 
              alt={alt}
              className="logo-svg"
            />
          </div>
        );

      case 'full':
      default:
        return (
          <div className={`logo-full ${size} ${className}`} onClick={onClick}>
            <div className="logo-icon-part">
              <img 
                src="/assets/logo-icon.svg" 
                alt="Sendroli Group Icon"
                className="logo-svg"
              />
            </div>
            <div className="logo-text-part">
              <img 
                src="/assets/logo-text.svg" 
                alt="Sendroli Group Text"
                className="logo-svg"
              />
            </div>
          </div>
        );
    }
  };

  return getLogoContent();
};

export default Logo;