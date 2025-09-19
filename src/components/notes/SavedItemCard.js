import React from 'react';
import './SavedItemCard.css';

const SavedItemCard = ({ item, onOpen, onReview, onToggleStar, className = '' }) => {
  if (!item) return null;

  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
    }
  };

  const handleReview = (evt) => {
    evt.stopPropagation();
    if (onReview) {
      onReview(item);
    }
  };

  const handleToggleStar = (evt) => {
    evt.stopPropagation();
    if (onToggleStar) {
      onToggleStar(item);
    }
  };

  return (
    <article
      className={`saved-item-card ${className}`.trim()}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyPress={(evt) => evt.key === 'Enter' && handleOpen()}
    >
      <header className="saved-item-card__header">
        <span className={`saved-item-card__badge saved-item-card__badge--${item.type || 'problem'}`}>
          {item.type || 'problem'}
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
        </div>
      </header>
      <h3 className="saved-item-card__title">{item.title}</h3>
      <p className="saved-item-card__excerpt">{item.excerpt}</p>
      <footer className="saved-item-card__footer">
        <div className="saved-item-card__tags">
          <span>{item.subject}</span>
          {item.tags?.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <button type="button" className="saved-item-card__action" onClick={handleReview}>
          Review
        </button>
      </footer>
    </article>
  );
};

export default SavedItemCard;

