import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WidgetCard.css';

const WidgetCard = ({ title, subtitle, actions, children, className = '', minimal = false, onClick, to, ariaLabel }) => {
  const navigate = useNavigate();
  const clickable = Boolean(onClick || to);
  const handleAction = (e) => {
    if (onClick) onClick(e);
    if (to) navigate(to);
  };
  return (
    <div
      className={`widget-card ${className} ${minimal ? 'minimal' : ''} ${clickable ? 'clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
      aria-label={ariaLabel || title}
      onClick={clickable ? handleAction : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleAction(e); } : undefined}
    >
      <div className="widget-card-header">
        <div>
          <h3 className="widget-card-title">{title}</h3>
          {subtitle && <p className="widget-card-subtitle">{subtitle}</p>}
        </div>
        <div className="widget-card-actions">{actions}</div>
      </div>
      <div className="widget-card-body">{children}</div>
    </div>
  );
};

export default React.memo(WidgetCard);
