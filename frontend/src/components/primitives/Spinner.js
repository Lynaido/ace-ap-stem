import React from 'react';
import './Spinner.css';

const Spinner = ({ 
  size = 'medium', 
  color = 'primary',
  className = '',
  ...props 
}) => {
  const baseClasses = 'spinner-primitive';
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;
  
  const spinnerClasses = [
    baseClasses,
    sizeClass,
    colorClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={spinnerClasses}
      role="status"
      aria-label="Loading"
      aria-live="polite"
      {...props}
    >
      <div className="spinner-circle"></div>
      <span className="spinner-sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;