import React, { useState, useRef, useEffect } from 'react';
import './Tabs.css';

const Tabs = ({ 
  tabs = [], 
  active = 0, 
  onChange,
  variant = 'default',
  size = 'medium',
  className = '',
  disabled = false,
  ...props 
}) => {
  const [activeIndex, setActiveIndex] = useState(active);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef([]);
  
  // Update active index when prop changes
  useEffect(() => {
    setActiveIndex(active);
  }, [active]);
  
  // Update indicator position
  useEffect(() => {
    if (tabsRef.current[activeIndex] && variant === 'underline') {
      const activeTab = tabsRef.current[activeIndex];
      const { offsetLeft, offsetWidth } = activeTab;
      
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeIndex, variant, tabs]);
  
  const handleTabClick = (index, tab) => {
    if (disabled || tab.disabled) return;
    
    setActiveIndex(index);
    if (onChange) {
      onChange(index, tab);
    }
  };
  
  const handleKeyDown = (e, index, tab) => {
    if (disabled || tab.disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabClick(index, tab);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        const nextTab = tabs[nextIndex];
        if (!nextTab.disabled) {
          tabsRef.current[nextIndex]?.focus();
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        const prevTab = tabs[prevIndex];
        if (!prevTab.disabled) {
          tabsRef.current[prevIndex]?.focus();
        }
        break;
        
      case 'Home':
        e.preventDefault();
        const firstEnabledIndex = tabs.findIndex(tab => !tab.disabled);
        if (firstEnabledIndex !== -1) {
          tabsRef.current[firstEnabledIndex]?.focus();
        }
        break;
        
      case 'End':
        e.preventDefault();
        const lastEnabledIndex = tabs.map((tab, i) => ({ tab, i }))
          .reverse()
          .find(({ tab }) => !tab.disabled)?.i;
        if (lastEnabledIndex !== undefined) {
          tabsRef.current[lastEnabledIndex]?.focus();
        }
        break;
        
      default:
        break;
    }
  };
  
  const baseClasses = 'tabs-primitive';
  const variantClass = `tabs-${variant}`;
  const sizeClass = `tabs-${size}`;
  const disabledClass = disabled ? 'tabs-disabled' : '';
  
  const tabsClasses = [
    baseClasses,
    variantClass,
    sizeClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  if (!tabs.length) {
    return null;
  }
  
  const activeTab = tabs[activeIndex];
  
  return (
    <div className="tabs-container" {...props}>
      <div className={tabsClasses} role="tablist">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const isDisabled = disabled || tab.disabled;
          
          return (
            <button
              key={tab.id || index}
              ref={el => tabsRef.current[index] = el}
              className={`tabs-tab ${isActive ? 'tabs-tab-active' : ''} ${isDisabled ? 'tabs-tab-disabled' : ''}`}
              onClick={() => handleTabClick(index, tab)}
              onKeyDown={(e) => handleKeyDown(e, index, tab)}
              disabled={isDisabled}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id || index}`}
              id={`tab-${tab.id || index}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.icon && (
                <span className="tabs-tab-icon" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              <span className="tabs-tab-label">{tab.label}</span>
              {tab.badge && (
                <span className="tabs-tab-badge" aria-label={`${tab.badge} items`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
        
        {variant === 'underline' && (
          <div 
            className="tabs-indicator" 
            style={indicatorStyle}
            aria-hidden="true"
          />
        )}
      </div>
      
      <div className="tabs-content">
        {activeTab && activeTab.content && (
          <div
            className="tabs-panel"
            role="tabpanel"
            id={`tabpanel-${activeTab.id || activeIndex}`}
            aria-labelledby={`tab-${activeTab.id || activeIndex}`}
            tabIndex={0}
          >
            {typeof activeTab.content === 'function' 
              ? activeTab.content(activeTab, activeIndex)
              : activeTab.content
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;