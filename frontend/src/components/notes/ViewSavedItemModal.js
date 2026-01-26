import React from 'react';
import Button from '../primitives/Button';
import SolutionDisplay from '../problem-solving/SolutionDisplay';
import './ViewSavedItemModal.css';

const ViewSavedItemModal = ({
  isOpen,
  onClose,
  savedItem,
  onDelete
}) => {
  if (!isOpen || !savedItem) return null;

  const renderContent = () => {
    switch (savedItem.type) {
      case 'SOLUTION':
        return (
          <div className="saved-item-view-content">
            <div className="problem-context">
              <h3>Problem</h3>
              <p>{savedItem.problem?.description || savedItem.excerpt}</p>
              {savedItem.problem?.imageUrl && (
                <img 
                  src={savedItem.problem.imageUrl} 
                  alt="Problem" 
                  className="problem-image"
                />
              )}
            </div>
            {savedItem.solution && (
              <SolutionDisplay 
                solution={savedItem.solution}
                problemText={savedItem.problem?.description}
                currentProblem={savedItem.problem}
                // Hide action buttons in view mode
                onGetHints={null}
                onViewConceptNotes={null}
              />
            )}
          </div>
        );
      
      case 'CONCEPT_NOTE':
        return (
          <div className="saved-item-view-content">
            <div className="problem-context">
              <h3>Problem</h3>
              <p>{savedItem.problem?.description || savedItem.excerpt}</p>
            </div>
            {savedItem.conceptNote && (
              <div className="concept-note-single">
                <h3>{savedItem.conceptNote.title}</h3>
                <div className="concept-note-content">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{savedItem.conceptNote.content}</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'HINT':
        return (
          <div className="saved-item-view-content">
            <div className="problem-context">
              <h3>Problem</h3>
              <p>{savedItem.problem?.description || savedItem.excerpt}</p>
            </div>
            {savedItem.hint && (
              <div className="hint-single">
                <h3>Hint</h3>
                <div className="hint-content">
                  <p>{savedItem.hint.content}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'PROBLEM':
        return (
          <div className="saved-item-view-content">
            <div className="problem-full-view">
              <h3>{savedItem.problem?.title || savedItem.title}</h3>
              <div className="problem-meta">
                <span className="badge">{savedItem.problem?.subject || savedItem.subject}</span>
                <span className="badge">{savedItem.problem?.difficulty || 'Medium'}</span>
              </div>
              <div className="problem-description">
                <p>{savedItem.problem?.description || savedItem.excerpt}</p>
              </div>
              {savedItem.problem?.imageUrl && (
                <img 
                  src={savedItem.problem.imageUrl} 
                  alt="Problem" 
                  className="problem-image"
                />
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="saved-item-view-content">
            <p>Unable to display this item type.</p>
          </div>
        );
    }
  };

  return (
    <div className="modal-overlay view-saved-modal-overlay" onClick={onClose}>
      <div className="modal-content view-saved-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <div className="header-title">
              <span className={`item-type-badge ${savedItem.type?.toLowerCase()}`}>
                {savedItem.type?.replace('_', ' ')}
              </span>
              <h2>{savedItem.title}</h2>
            </div>
            <div className="header-meta">
              {savedItem.subject && <span className="meta-tag">{savedItem.subject}</span>}
              {savedItem.difficulty && <span className="meta-tag">{savedItem.difficulty}</span>}
              {savedItem.tags?.map(tag => (
                <span key={tag} className="meta-tag">{tag}</span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {renderContent()}
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                // Navigate to study mode with this item
                window.location.href = `/study-mode?itemId=${savedItem.id}`;
              }}
            >
              Practice This
            </Button>
            {onDelete && (
              <Button
                variant="danger"
                size="small"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this item?')) {
                    onDelete(savedItem.id);
                    onClose();
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button
              variant="primary"
              size="small"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSavedItemModal;
