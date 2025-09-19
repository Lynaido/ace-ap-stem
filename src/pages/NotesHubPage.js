import React, { useMemo, useState } from 'react';
import FolderSidebar from '../components/notes/FolderSidebar';
import SavedItemCard from '../components/notes/SavedItemCard';
import './NotesHubPage.css';

const initialFolders = [
  { id: 'recent', name: 'Recent Sessions', count: 6 },
  { id: 'algebra', name: 'Algebra Drills', count: 4 },
  { id: 'physics', name: 'Physics Prep', count: 3 },
  { id: 'favorites', name: 'Favorites', count: 2 },
];

const initialItems = {
  recent: [
    {
      id: 'item-1',
      type: 'solution',
      title: 'Quadratic Optimization Problem',
      excerpt: 'Complete square method to maximize area of a rectangular pen.',
      subject: 'Algebra II',
      tags: ['quadratics', 'maxima'],
      updatedAt: '2025-09-10',
      relativeUpdated: '3 days ago',
      starred: true,
    },
    {
      id: 'item-2',
      type: 'concept',
      title: 'Newtonian Motion Notes',
      excerpt: 'Summary of steps to decompose multi-force motion problems.',
      subject: 'Physics',
      tags: ['forces', 'vectors'],
      updatedAt: '2025-09-09',
      relativeUpdated: '4 days ago',
      starred: false,
    },
    {
      id: 'item-3',
      type: 'problem',
      title: 'Probability Practice Chat',
      excerpt: 'AI tutor walk-through on conditional probability scenarios.',
      subject: 'Statistics',
      tags: ['conditional', 'chat'],
      updatedAt: '2025-09-08',
      relativeUpdated: '5 days ago',
      starred: true,
    },
  ],
  algebra: [
    {
      id: 'item-4',
      type: 'problem',
      title: 'Factoring by Grouping Set',
      excerpt: 'Worksheet variants generated for factoring quartic polynomials.',
      subject: 'Algebra I',
      tags: ['practice', 'worksheet'],
      updatedAt: '2025-09-07',
      relativeUpdated: '6 days ago',
      starred: false,
    },
  ],
  physics: [
    {
      id: 'item-5',
      type: 'solution',
      title: 'Projectile Motion Explanation',
      excerpt: 'Tutor explanation for two-stage projectile launch.',
      subject: 'Physics',
      tags: ['projectile', 'solution'],
      updatedAt: '2025-09-05',
      relativeUpdated: 'last week',
      starred: false,
    },
  ],
  favorites: [],
};

const flattenItems = (itemsMap) =>
  Object.entries(itemsMap).flatMap(([folderId, items]) =>
    items.map((item) => ({ ...item, folderId }))
  );

const NotesHubPage = () => {
  const [folderData] = useState(initialFolders);
  const [itemsByFolder, setItemsByFolder] = useState(initialItems);
  const [activeFolderId, setActiveFolderId] = useState(initialFolders[0]?.id);
  const [searchQuery, setSearchQuery] = useState('');

  const starredItems = useMemo(
    () => flattenItems(itemsByFolder).filter((item) => item.starred),
    [itemsByFolder]
  );

  const baseItems = useMemo(
    () => (activeFolderId ? itemsByFolder[activeFolderId] || [] : []),
    [activeFolderId, itemsByFolder]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseItems;
    return baseItems.filter((item) => {
      const haystack = [item.title, item.excerpt, item.subject, (item.tags || []).join(' ')].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [baseItems, searchQuery]);

  const handleToggleStar = (targetItem) => {
    setItemsByFolder((prev) => {
      const { folderId, id } = targetItem;
      if (!prev[folderId]) return prev;
      return {
        ...prev,
        [folderId]: prev[folderId].map((item) =>
          item.id === id ? { ...item, starred: !item.starred } : item
        ),
      };
    });
  };

  const emptyStateTitle = baseItems.length
    ? 'No items match your search'
    : 'No items yet';

  const emptyStateBody = baseItems.length
    ? 'Try a different keyword or adjust your filters.'
    : 'Add a new problem, upload notes, or save an AI tutor chat to populate this folder.';

  return (
    <div className="notes-hub-page">
      <div className="notes-hub-layout">
        <FolderSidebar
          folders={folderData}
          activeFolderId={activeFolderId}
          onSelect={setActiveFolderId}
        />
        <main className="notes-hub-main">
          <header className="notes-hub-header">
            <div>
              <h1>Notes Hub</h1>
              <p>Review saved solutions, chats, and custom practice sets.</p>
            </div>
            <div className="notes-hub-header-controls">
              <div className="notes-hub-search">
                <input
                  type="search"
                  placeholder="Search saved notes..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search notes"
                />
              </div>
              <div className="notes-hub-actions">
                <button type="button">New Folder</button>
                <button type="button" className="primary">Upload Notes</button>
              </div>
            </div>
          </header>

          {starredItems.length > 0 && (
            <section className="notes-hub-starred">
              <div className="notes-hub-section-header">
                <h2>Starred</h2>
                <span>{starredItems.length} saved</span>
              </div>
              <div className="notes-hub-starred__list">
                {starredItems.map((item) => (
                  <SavedItemCard
                    key={`${item.folderId}-${item.id}`}
                    item={item}
                    onToggleStar={handleToggleStar}
                    className="compact"
                  />
                ))}
              </div>
            </section>
          )}

          {filteredItems.length ? (
            <section className="notes-hub-grid">
              {filteredItems.map((item) => (
                <SavedItemCard
                  key={item.id}
                  item={{ ...item, folderId: activeFolderId }}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </section>
          ) : (
            <section className="notes-hub-empty" role="status">
              <div className="notes-hub-empty__card">
                <h2>{emptyStateTitle}</h2>
                <p>{emptyStateBody}</p>
                <button type="button" className="primary">Create your first item</button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotesHubPage;
