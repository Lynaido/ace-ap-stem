import React from 'react';
import './FolderSidebar.css';

const FolderSidebar = ({ folders = [], activeFolderId, onSelect, className = '' }) => {
  const joinClass = (base, condition) => (condition ? `${base} active` : base);

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
          return (
            <button
              key={folder.id}
              type="button"
              className={joinClass('folder-item', isActive)}
              onClick={() => onSelect?.(folder.id)}
            >
              <div className="folder-item__name">{folder.name}</div>
              <div className="folder-item__meta">
                {folder.count} item{folder.count === 1 ? '' : 's'}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default FolderSidebar;
