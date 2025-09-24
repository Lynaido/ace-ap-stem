import React, { useEffect, useMemo, useState } from 'react';
import FolderSidebar from '../components/notes/FolderSidebar';
import SavedItemCard from '../components/notes/SavedItemCard';
import { useAppContext } from '../context/AppContext';
import './NotesHubPage.css';

const NotesHubPage = () => {
  const { getProblems } = useAppContext();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const data = await getProblems();
        setProblems(data);
      } catch (err) {
        setError('Failed to fetch problems. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [getProblems]);

  const starredItems = useMemo(
    () => problems.filter((item) => item.starred),
    [problems]
  );

  const baseItems = useMemo(() => {
    if (activeFolderId === 'all') {
      return problems;
    }
    return problems.filter((item) => item.subject === activeFolderId);
  }, [activeFolderId, problems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseItems;
    return baseItems.filter((item) => {
      const haystack = [item.title, item.excerpt, item.subject, (item.tags || []).join(' ')].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [baseItems, searchQuery]);

  const handleToggleStar = (targetItem) => {
    setProblems((prev) =>
      prev.map((item) =>
        item.id === targetItem.id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  const emptyStateTitle = baseItems.length
    ? 'No items match your search'
    : 'No items yet';

  const emptyStateBody = baseItems.length
    ? 'Try a different keyword or adjust your filters.'
    : 'Add a new problem, upload notes, or save an AI tutor chat to populate this folder.';

  const folders = useMemo(() => {
    const subjectCounts = problems.reduce((acc, problem) => {
      acc[problem.subject] = (acc[problem.subject] || 0) + 1;
      return acc;
    }, {});

    const subjectFolders = Object.entries(subjectCounts).map(([subject, count]) => ({
      id: subject,
      name: subject.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));

    return [
      { id: 'all', name: 'All Items', count: problems.length },
      ...subjectFolders,
    ];
  }, [problems]);

  return (
    <div className="notes-hub-page">
      <div className="notes-hub-layout">
        <FolderSidebar
          folders={folders}
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

          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && (
            <>
              {starredItems.length > 0 && (
                <section className="notes-hub-starred">
                  <div className="notes-hub-section-header">
                    <h2>Starred</h2>
                    <span>{starredItems.length} saved</span>
                  </div>
                  <div className="notes-hub-starred__list">
                    {starredItems.map((item) => (
                      <SavedItemCard
                        key={item.id}
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
                      item={item}
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotesHubPage;
