import React from 'react';
import Button from './Button';
import './EmptyState.css';

const EmptyState = ({ 
  icon = null, 
  title = 'No content available', 
  message = '', 
  action = null,
  className = '',
  variant = 'default',
  size = 'medium',
  ...props 
}) => {
  const baseClasses = 'empty-state-primitive';
  const variantClass = `empty-state-${variant}`;
  const sizeClass = `empty-state-${size}`;
  
  const emptyStateClasses = [
    baseClasses,
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
  
  const renderAction = () => {
    if (!action) return null;
    
    // If action is already a React element, render it directly
    if (React.isValidElement(action)) {
      return <div className="empty-state-action">{action}</div>;
    }
    
    // If action is an object with button properties
    if (typeof action === 'object') {
      return (
        <div className="empty-state-action">
          <Button
            variant={action.variant || 'primary'}
            size={action.size || 'medium'}
            onClick={action.onClick}
            disabled={action.disabled}
            icon={action.icon}
          >
            {action.label || 'Take Action'}
          </Button>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={emptyStateClasses} {...props}>
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      
      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        {message && (
          <p className="empty-state-message">{message}</p>
        )}
      </div>
      
      {renderAction()}
    </div>
  );
};

export default EmptyState;