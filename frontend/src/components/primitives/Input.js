import React, { useState, forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  label = '', 
  error = '',
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoComplete,
  rows = 4,
  maxLength,
  ...props 
}, ref) => {
  const [focused, setFocused] = useState(false);
  
  // Generate unique id if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input-primitive';
  const errorClass = error ? 'input-error' : '';
  const disabledClass = disabled ? 'input-disabled' : '';
  const focusedClass = focused ? 'input-focused' : '';
  const hasValueClass = value ? 'input-has-value' : '';
  
  const inputClasses = [
    baseClasses,
    errorClass,
    disabledClass,
    focusedClass,
    hasValueClass,
    className
  ].filter(Boolean).join(' ');
  
  const handleFocus = (e) => {
    setFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };
  
  const handleBlur = (e) => {
    setFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };
  
  const inputProps = {
    ref,
    id: inputId,
    name: name || inputId,
    value: value || '',
    onChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    disabled,
    required,
    autoComplete,
    maxLength,
    className: inputClasses,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? `${inputId}-error` : undefined,
    ...props
  };
  
  return (
    <div className="input-container">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {type === 'textarea' ? (
          <textarea
            {...inputProps}
            rows={rows}
          />
        ) : (
          <input
            {...inputProps}
            type={type}
          />
        )}
      </div>
      
      {error && (
        <div id={`${inputId}-error`} className="input-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;