import React from 'react';
import './DashboardGrid.css';

const DashboardGrid = ({ children }) => {
  return <div className="dashboard-grid-wrap">{children}</div>;
};

export default React.memo(DashboardGrid);
