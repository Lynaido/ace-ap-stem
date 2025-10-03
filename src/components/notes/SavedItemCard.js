import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SavedItemCard.css';

const SavedItemCard = ({ item, onOpen, onReview, onToggleStar, onDeleteItem, className = '' }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!item) return null;

  const handleDragStart = (evt) => {
    evt.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id }));
    evt.dataTransfer.effectAllowed = 'move';
  };

  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
    }
  };

  const handleReview = (evt) => {
    evt.stopPropagation();
    // Open the item in view mode
    if (onOpen) {
      onOpen(item);
    } else if (onReview) {
      onReview(item);
    }
  };

  const handleToggleStar = (evt) => {
    evt.stopPropagation();
    if (onToggleStar) {
      onToggleStar(item);
    }
  };

  const handleDelete = (evt) => {
    evt.stopPropagation();
    if (onDeleteItem) {
      onDeleteItem(item.id);
    }
    setMenuOpen(false);
  };
  
  const toggleMenu = (evt) => {
    evt.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <article
      className={`saved-item-card ${className}`.trim()}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyPress={(evt) => evt.key === 'Enter' && handleOpen()}
      draggable="true"
      onDragStart={handleDragStart}
    >
      <header className="saved-item-card__header">
        <span className={`saved-item-card__badge saved-item-card__badge--${item.type?.toLowerCase() || 'problem'}`}>
          {item.type?.replace('_', ' ') || 'problem'}
        </span>
        <div className="saved-item-card__meta">
          <time className="saved-item-card__time" dateTime={item.updatedAt}>
            Updated {item.relativeUpdated}
          </time>
          <button
            type="button"
            className={`saved-item-card__star ${item.starred ? 'is-starred' : ''}`.trim()}
            onClick={handleToggleStar}
            aria-label={item.starred ? 'Unstar item' : 'Star item'}
            aria-pressed={item.starred}
          >
            ★
          </button>
          <div className="saved-item-card__menu-container">
            <button
              type="button"
              className="saved-item-card__menu-toggle"
              onClick={toggleMenu}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              …
            </button>
            {menuOpen && (
              <div className="saved-item-card__menu">
                <button type="button" onClick={handleDelete}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <h3 className="saved-item-card__title">{item.title}</h3>
      <p className="saved-item-card__excerpt">{item.excerpt}</p>
      <footer className="saved-item-card__footer">
        <div className="saved-item-card__tags">
          {item.subject && <span>{item.subject}</span>}
          {item.tags?.filter(tag => tag !== item.subject).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="saved-item-card__actions">
          <button type="button" className="saved-item-card__action" onClick={handleReview}>
            Review
          </button>
          <Link to={{ pathname: "/study-mode" }} state={{ problem: item }} className="saved-item-card__action study-action">
            Study
          </Link>
        </div>
      </footer>
    </article>
  );
};

export default SavedItemCard;
