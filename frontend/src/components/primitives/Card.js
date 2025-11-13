import React from 'react';
import Button from './Button';
import './Card.css';

const Card = ({ 
  title = '', 
  children, 
  actions = [], 
  className = '',
  variant = 'default',
  padding = 'normal',
  ...props 
}) => {
  const baseClasses = 'card-primitive';
  const variantClass = `card-${variant}`;
  const paddingClass = `card-padding-${padding}`;
  
  const cardClasses = [
    baseClasses,
    variantClass,
    paddingClass,
    className
  ].filter(Boolean).join(' ');
  
  const hasHeader = title || actions.length > 0;
  
  return (
    <div className={cardClasses} {...props}>
      {hasHeader && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions.length > 0 && (
            <div className="card-actions">
              {actions.map((action, index) => {
                if (React.isValidElement(action)) {
                  return React.cloneElement(action, { key: index });
                }
                
                if (typeof action === 'object' && action.label) {
                  return (
                    <Button
                      key={index}
                      variant={action.variant || 'ghost'}
                      size={action.size || 'small'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      icon={action.icon}
                    >
                      {action.label}
                    </Button>
                  );
                }
                
                return null;
              })}
            </div>
          )}
        </div>
      )}
      
      {children && (
        <div className="card-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default Card;