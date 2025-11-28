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
}) => {
  return (
    <div className={`kpi-card ${featured ? 'featured' : ''}`}>
      <div className="kpi-icon" style={{ background: gradient }}>
        {image ? (
          <img src={image} alt={label} className="kpi-image" />
        ) : (
          <span className="kpi-emoji">{icon}</span>
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

