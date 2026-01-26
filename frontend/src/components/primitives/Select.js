import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import './Select.css';

const Select = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select an option...', 
  label = '',
  error = '',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  multiple = false,
  searchable = false,
  clearable = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const selectRef = useRef(null);
  const listRef = useRef(null);
  
  // Generate unique id if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  // Filter options based on search term
  const filteredOptions = searchTerm 
    ? options.filter(option => 
        (typeof option === 'string' ? option : option.label)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Get display value
  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => 
          (typeof opt === 'string' ? opt : opt.value) === value[0]
        );
        return typeof option === 'string' ? option : option?.label || value[0];
      }
      return `${value.length} items selected`;
    }
    
    if (!value) return placeholder;
    
    const option = options.find(opt => 
      (typeof opt === 'string' ? opt : opt.value) === value
    );
    return typeof option === 'string' ? option : option?.label || value;
  };
  
  // Handle option selection
  const handleOptionSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange && onChange(newValues);
    } else {
      onChange && onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          const option = filteredOptions[focusedIndex];
          const optionValue = typeof option === 'string' ? option : option.value;
          handleOptionSelect(optionValue);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
        
      default:
        if (searchable && isOpen && e.key.length === 1) {
          setSearchTerm(prev => prev + e.key);
        }
        break;
    }
  };
  
  // Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange(multiple ? [] : '');
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const optionElement = listRef.current.children[focusedIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);
  
  const baseClasses = 'select-primitive';
  const errorClass = error ? 'select-error' : '';
  const disabledClass = disabled ? 'select-disabled' : '';
  const openClass = isOpen ? 'select-open' : '';
  
  const selectClasses = [
    baseClasses,
    errorClass,
    disabledClass,
    openClass,
    className
  ].filter(Boolean).join(' ');
  
  const hasValue = multiple 
    ? Array.isArray(value) && value.length > 0
    : Boolean(value);
  
  return (
    <div className="select-container" ref={selectRef}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <span className="select-required" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="select-wrapper">
        <div
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${selectId}-listbox`}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          id={selectId}
          {...props}
        >
          <span className={`select-value ${hasValue ? 'select-has-value' : 'select-placeholder'}`}>
            {getDisplayValue()}
          </span>
          
          <div className="select-indicators">
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                className="select-clear"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
            <div className={`select-arrow ${isOpen ? 'select-arrow-up' : ''}`}>
              <FaChevronDown />
            </div>
          </div>
        </div>
        
        {isOpen && (
          <div className="select-dropdown">
            {searchable && (
              <div className="select-search">
                <input
                  type="text"
                  className="select-search-input"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <ul
              className="select-options"
              role="listbox"
              id={`${selectId}-listbox`}
              aria-multiselectable={multiple}
              ref={listRef}
            >
              {filteredOptions.length === 0 ? (
                <li className="select-no-options">No options found</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  const isSelected = multiple 
                    ? Array.isArray(value) && value.includes(optionValue)
                    : value === optionValue;
                  const isFocused = index === focusedIndex;
                  
                  return (
                    <li
                      key={optionValue}
                      className={`select-option ${isSelected ? 'select-option-selected' : ''} ${isFocused ? 'select-option-focused' : ''}`}
                      onClick={() => handleOptionSelect(optionValue)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="select-option-label">{optionLabel}</span>
                      {isSelected && (
                        <span className="select-option-check">
                          <FaCheck />
                        </span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      
      {error && (
        <div id={`${selectId}-error`} className="select-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default Select;