import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../primitives/Button';
import './SaveNotesModal.css';

const SaveNotesModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  itemType, 
  itemData,
  folders = [],
  defaultTitle = '',
  defaultTags = []
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [tags, setTags] = useState(defaultTags.join(', '));
  const [starred, setStarred] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Note: title is not stored in SavedItem, it comes from the related entity
      const saveData = {
        type: itemType,
        starred,
        tags: tagsArray,
        ...itemData
      };

      // Only add folderId if it's not empty
      if (selectedFolderId) {
        saveData.folderId = selectedFolderId;
      }

      // Remove any undefined values
      Object.keys(saveData).forEach(key => {
        if (saveData[key] === undefined) {
          delete saveData[key];
        }
      });

      console.log('Saving with data:', saveData);
      await onSave(saveData);
      toast.success('Notes saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(error.message || 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case 'SOLUTION':
        return 'Solution';
      case 'CONCEPT_NOTE':
        return 'Concept Notes';
      case 'HINT':
        return 'Hints';
      default:
        return 'Item';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content save-notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Save {getItemTypeLabel()}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="save-title">Title (Preview Only)</label>
            <input
              type="text"
              id="save-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Title will be derived from the saved item`}
              disabled
              maxLength="200"
            />
            <small className="form-hint">The title is automatically set from your problem/solution</small>
          </div>

          <div className="form-group">
            <label htmlFor="save-folder">Folder (Optional)</label>
            <select
              id="save-folder"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
            >
              <option value="">No Folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="save-tags">Tags (Optional)</label>
            <input
              type="text"
              id="save-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <small className="form-hint">Example: physics, mechanics, energy</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={starred}
                onChange={(e) => setStarred(e.target.checked)}
              />
              <span>Mark as starred</span>
            </label>
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save to Notes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveNotesModal;
