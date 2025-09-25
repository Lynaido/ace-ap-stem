import React, { useState } from 'react';
import './FolderSidebar.css';

const FolderSidebar = ({ folders = [], activeFolderId, onSelect, onDeleteFolder, onItemDrop, className = '' }) => {
  const [dragOverId, setDragOverId] = useState(null);
  const joinClass = (base, condition) => (condition ? `${base} active` : base);

  const handleDragOver = (evt, folderId) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (evt, folderId) => {
    evt.preventDefault();
    const data = JSON.parse(evt.dataTransfer.getData('application/json'));
    if (data.itemId) {
      onItemDrop?.(data.itemId, folderId);
    }
    setDragOverId(null);
  };

  if (!folders.length) {
    return (
      <aside className={`folder-sidebar ${className}`.trim()}>
        <div className="folder-empty">No folders yet</div>
      </aside>
    );
  }

  return (
    <aside className={`folder-sidebar ${className}`.trim()}>
      <header className="folder-header">
        <h2>My Collections</h2>
        <p>Organize problems, solutions, and chats.</p>
      </header>
      <nav className="folder-list" aria-label="Saved folders">
        {folders.map((folder) => {
          const isActive = folder.id === activeFolderId;
          const isDeletable = folder.id !== 'all';
          const isDragOver = dragOverId === folder.id;

          return (
            <div
              key={folder.id}
              className={`folder-item-wrapper ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(evt) => handleDragOver(evt, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(evt) => handleDrop(evt, folder.id)}
            >
              <button
                type="button"
                className={joinClass('folder-item', isActive)}
                onClick={() => onSelect?.(folder.id)}
              >
                <div className="folder-item__name">{folder.name}</div>
                <div className="folder-item__meta">
                  {folder.count} item{folder.count === 1 ? '' : 's'}
                </div>
              </button>
              {isDeletable && (
                <button
                  type="button"
                  className="folder-delete-btn"
                  onClick={() => onDeleteFolder?.(folder.id)}
                  aria-label={`Delete folder ${folder.name}`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default FolderSidebar;
