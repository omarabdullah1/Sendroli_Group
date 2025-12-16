import React from 'react';
import { useNavigate } from 'react-router-dom';
import './KPICard.css';

const KPICard = ({ 
  label, 
  value, 
  trend, 
  trendType = 'positive', 
  icon, 
  image, 
  gradient = 'linear-gradient(135deg, #00CED1, #0099CC)',
  featured = false 
  , onClick, to, ariaLabel, className = ''
}) => {
  const navigate = useNavigate();
  const clickable = Boolean(onClick || to);
  const handleAction = (e) => {
    if (onClick) onClick(e);
    if (to) navigate(to);
  };
  return (
    <div
      className={`kpi-card ${featured ? 'featured' : ''} ${clickable ? 'clickable' : ''} ${className}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
      aria-label={ariaLabel || label}
      onClick={clickable ? handleAction : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleAction(e); } : undefined}
    >
      {/* Force icon color via container so SVGs (FontAwesome) inherit white */}
      <div className="kpi-icon" style={{ background: gradient, color: '#fff' }}>
        {image ? (
          <img src={image} alt={label} className="kpi-image" />
        ) : (
          // Accept both emoji (string) or a JSX icon (FontAwesome)
          // Ensure the passed icon inherits the container color by cloning and applying inline styles
          <span className="kpi-emoji" style={{ color: 'inherit' }}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              style: { ...(icon.props?.style || {}), color: '#fff', fill: '#fff' },
              className: `${icon.props?.className || ''} kpi-fa-icon`,
            }) : icon}
          </span>
        )}
      </div>
      <div className="kpi-content">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
        {trend && (
          <span className={`kpi-trend ${trendType}`}>
            {trendType === 'positive' && <span className="trend-icon">+20%</span>}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;

