import React from 'react';
import './Button.css';

const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  icon = null, 
  onClick, 
  children, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'btn-primitive';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';
  const iconClass = icon ? 'btn-with-icon' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClass,
    sizeClass,
    disabledClass,
    iconClass,
    className
  ].filter(Boolean).join(' ');
  
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <button 
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
    </button>
  );
};

export default Button;