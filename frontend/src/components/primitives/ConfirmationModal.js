import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger', 'primary', 'warning'
  icon = null
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIconForVariant = () => {
    if (icon) return icon;
    
    switch (confirmVariant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'primary':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-modal">
        <div className="confirmation-modal__content">
          <div className="confirmation-modal__icon">
            {getIconForVariant()}
          </div>
          <div className="confirmation-modal__text">
            <h3 className="confirmation-modal__title">{title}</h3>
            <p className="confirmation-modal__message">{message}</p>
          </div>
        </div>
        <div className="confirmation-modal__actions">
          <button
            type="button"
            className="confirmation-modal__btn confirmation-modal__btn--cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirmation-modal__btn confirmation-modal__btn--confirm confirmation-modal__btn--${confirmVariant}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
