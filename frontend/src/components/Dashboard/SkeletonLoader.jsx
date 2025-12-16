import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ width = '100%', height = 20, className = '' }) => (
  <div className={`skeleton-loader ${className}`} style={{ width, height }} />
);

export default React.memo(SkeletonLoader);
