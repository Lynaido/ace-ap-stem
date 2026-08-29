import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FolderSidebar from '../components/notes/FolderSidebar';
import SavedItemCard from '../components/notes/SavedItemCard';
import ViewSavedItemModal from '../components/notes/ViewSavedItemModal';
import ConfirmationModal from '../components/primitives/ConfirmationModal';
import { useAppContext } from '../context/AppContext';
import { savedItemsAPI } from '../utils/api';
import './NotesHubPage.css';
import { toast } from 'react-toastify';
import { FaArrowRight, FaFileAlt } from 'react-icons/fa';

const searchableText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '';
  }
};

const NotesHubPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    getFolders,
    createFolder,
    deleteSavedItem,
    deleteFolder
  } = useAppContext();
  const [savedItems, setSavedItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [foldersError, setFoldersError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showSaveItemModal, setShowSaveItemModal] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    type: '',
    subject: '',
    difficulty: '',
    tag: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFoldersError(null);

    const [itemsResult, foldersResult] = await Promise.allSettled([
      savedItemsAPI.getAll({ page: 1, limit: 20 }),
      getFolders()
    ]);

    if (itemsResult.status === 'fulfilled') {
      const response = itemsResult.value;
      setSavedItems(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: response.data?.length || 0 });
    } else {
      setError(itemsResult.reason?.message || 'We could not load your saved learning items.');
    }

    if (foldersResult.status === 'fulfilled') {
      setFolders(foldersResult.value);
    } else {
      setFoldersError('Collections are temporarily unavailable. Your saved items are still safe.');
    }

    setLoading(false);
  }, [getFolders]);

  const loadMoreItems = async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    setLoadingMore(true);
    try {
      const response = await savedItemsAPI.getAll({ page: pagination.page + 1, limit: 20 });
      setSavedItems((current) => [...current, ...(response.data || [])]);
      setPagination(response.pagination || pagination);
    } catch (loadMoreError) {
      toast.error(loadMoreError.message || 'Could not load more saved items.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refresh when component mounts or when refresh parameter is present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldRefresh = searchParams.get('refresh');
    
    if (shouldRefresh) {
      console.log('Forcing refresh due to URL parameter');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/notes-hub');
      
      // Force a fresh data fetch
      const timer = setTimeout(() => {
        fetchData();
      }, 300); // Slightly longer delay for forced refresh
      
      return () => clearTimeout(timer);
    }
  }, [location.search, fetchData]);

  // Refresh data when the page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Transform saved items for display
  const transformedItems = useMemo(() => {
    return savedItems.map(item => {
      // Format date safely
      let relativeUpdated = 'Recently';
      try {
        const date = new Date(item.updatedAt || item.createdAt);
        if (!isNaN(date.getTime())) {
          relativeUpdated = date.toLocaleDateString();
        }
      } catch (e) {
        // Use default 'Recently'
      }
      
      const baseItem = {
        ...item,
        relativeUpdated
      };

      // Extract data from nested objects based on type
      switch (item.type) {
        case 'PROBLEM':
          if (item.problem) {
            return {
              ...baseItem,
              title: item.problem.title.replace(/^Problem:\s*/i, ''),
              excerpt: item.problem.description,
              subject: item.problem.subject,
              difficulty: item.problem.difficulty,
              // Remove subject/difficulty from tags to avoid duplication
              tags: (item.tags || []).filter(tag => 
                tag !== item.problem.subject && tag !== item.problem.difficulty
              )
            };
          }
          break;
        case 'SOLUTION':
          if (item.solution && item.problem) {
            return {
              ...baseItem,
              title: item.problem.title || 'Solution',
              excerpt: item.solution.finalAnswer || item.solution.content?.substring(0, 150) || 'View full solution',
              subject: item.problem.subject || 'Unknown',
              difficulty: item.problem.difficulty,
              // Remove subject/difficulty from tags to avoid duplication
              tags: (item.tags || []).filter(tag => 
                tag !== item.problem.subject && tag !== item.problem.difficulty
              )
            };
          }
          break;
        case 'HINT':
          if (item.hint && item.problem) {
            return {
              ...baseItem,
              title: item.problem.title || 'Hint',
              excerpt: item.hint.content?.substring(0, 150) || 'View hint',
              subject: item.problem.subject || 'Unknown',
              difficulty: item.problem.difficulty,
              // Remove subject/difficulty from tags to avoid duplication
              tags: (item.tags || []).filter(tag => 
                tag !== item.problem.subject && tag !== item.problem.difficulty
              )
            };
          }
          break;
        case 'CONCEPT_NOTE':
          if (item.conceptNote) {
            return {
              ...baseItem,
              title: item.conceptNote.title || (item.problem?.title ? `${item.problem.title} - Concepts` : 'Concept Notes'),
              excerpt: item.conceptNote.content?.substring(0, 150) || 'View concept notes',
              subject: item.problem?.subject || 'Unknown',
              difficulty: item.problem?.difficulty,
              // Remove subject/difficulty from tags to avoid duplication
              tags: (item.tags || []).filter(tag => 
                tag !== item.problem?.subject && tag !== item.problem?.difficulty
              )
            };
          }
          break;
        default:
          return {
            ...baseItem,
            title: 'Unknown Item',
            excerpt: 'No description available',
            subject: 'Unknown'
          };
      }

      return baseItem;
    });
  }, [savedItems]);

  const starredItems = useMemo(
    () => transformedItems.filter((item) => item.starred),
    [transformedItems]
  );

  const baseItems = useMemo(() => {
    if (activeFolderId === 'all') {
      return transformedItems;
    }
    // Filter by actual folder relationship
    return transformedItems.filter((item) => item.folderId === activeFolderId);
  }, [activeFolderId, transformedItems]);

  const filteredItems = useMemo(() => {
    let items = baseItems;

    // Apply dropdown filters
    if (activeFilters.type) {
      items = items.filter(item => item.type === activeFilters.type);
    }
    if (activeFilters.subject) {
      items = items.filter(item => item.subject === activeFilters.subject);
    }
    if (activeFilters.difficulty) {
      items = items.filter(item => item.difficulty === activeFilters.difficulty);
    }
    if (activeFilters.tag) {
      items = items.filter(item => (item.tags || []).includes(activeFilters.tag));
    }

    // Apply search query
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    
    return items.filter((item) => {
      const haystack = [
        item.title || '',
        searchableText(item.excerpt),
        item.subject || '',
        (item.tags || []).join(' ')
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [baseItems, searchQuery, activeFilters]);

  const handleToggleStar = async (targetItem) => {
    try {
      // Find the original saved item (not transformed)
      const originalItem = savedItems.find(item => item.id === targetItem.id);
      if (!originalItem) return;

      // Update via API with correct data structure
      const updateData = {
        type: originalItem.type,
        problemId: originalItem.problemId,
        solutionId: originalItem.solutionId,
        hintId: originalItem.hintId,
        conceptNoteId: originalItem.conceptNoteId,
        starred: !originalItem.starred,
        tags: originalItem.tags
      };

      await savedItemsAPI.update(originalItem.id, updateData);
      
      // Update local state
      setSavedItems((prev) =>
        prev.map((item) =>
          item.id === targetItem.id ? { ...item, starred: !item.starred } : item
        )
      );
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDeleteItem = (itemId) => {
    const itemToDelete = savedItems.find(item => item.id === itemId);
    const itemName = itemToDelete?.title || 'this item';

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        // Optimistically remove the item from the UI
        setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
        try {
          await deleteSavedItem(itemId);
        } catch (error) {
          // If the delete fails, refresh the data to revert the change
          fetchData();
        }
      }
    });
  };

  const handleDeleteFolder = (folderId) => {
    const folderToDelete = folders.find(f => f.id === folderId);
    if (!folderToDelete) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Folder',
      message: `Are you sure you want to delete the folder "${folderToDelete.name}"? Items inside will be moved to "All Items".`,
      confirmText: 'Delete Folder',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFolder(folderId);
          setActiveFolderId('all'); // Go back to all items view
          fetchData(); // Refresh all data
        } catch (error) {
          // Error toast is handled in context
        }
      }
    });
  };

  const handleItemDrop = async (itemId, targetFolderId) => {
    try {
      // Find the item being moved
      const itemToMove = savedItems.find(item => item.id === itemId);
      if (!itemToMove || itemToMove.folderId === targetFolderId) {
        return; // Don't do anything if it's the same folder
      }

      // Optimistically update the UI
      setSavedItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, folderId: targetFolderId } : item
      ));

      // Call the API to update the item
      await savedItemsAPI.update(itemId, { folderId: targetFolderId });

      // Optionally, show a success toast
      toast.success('Item moved successfully!');
    } catch (error) {
      toast.error(`Failed to move item: ${error.message}`);
      // Revert the optimistic update on failure
      fetchData();
    }
  };

  const handleCreateFolder = () => {
    setShowFolderModal(true);
  };

  const handleFolderSubmit = async (folderData) => {
    try {
      await createFolder(folderData);
      // Refresh folders
      const foldersData = await getFolders();
      setFolders(foldersData);
      setShowFolderModal(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      // Handle error (show toast or error state)
    }
  };

  const handleSaveItem = () => {
    setShowSaveItemModal(true);
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      type: '',
      subject: '',
      difficulty: '',
      tag: ''
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'Confirm',
      confirmVariant: 'danger'
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');

  const emptyStateTitle = baseItems.length
    ? 'No items match your search'
    : 'No items yet';

  const emptyStateBody = baseItems.length
    ? 'Try a different keyword or adjust your filters.'
    : 'Click "Save Item" to add problems, solutions, hints, or concept notes to your library.';

  // Get available filter options
  const filterOptions = useMemo(() => {
    const types = [...new Set(savedItems.map(item => item.type))];
    const subjects = [...new Set(savedItems.map(item => 
      item.problem?.subject || item.solution?.subject || item.hint?.subject || item.conceptNote?.subject
    ).filter(Boolean))];
    const difficulties = [...new Set(savedItems.map(item => 
      item.problem?.difficulty
    ).filter(Boolean))];
    const tags = [...new Set(savedItems.flatMap(item => item.tags || []))];

    return { types, subjects, difficulties, tags };
  }, [savedItems]);

  // Clean folder system - only real folders + "All Items"
  const allFolders = useMemo(() => {
    const foldersWithCounts = folders.map(folder => ({
      ...folder,
      count: savedItems.filter(item => 
        item.folderId === folder.id
      ).length
    }));

    return [
      { id: 'all', name: 'All Items', count: savedItems.length },
      ...foldersWithCounts
    ];
  }, [savedItems, folders]);

  return (
    <div className="notes-hub-page">
      <div className="notes-hub-layout">
        <FolderSidebar
          folders={allFolders}
          activeFolderId={activeFolderId}
          onSelect={setActiveFolderId}
          onDeleteFolder={handleDeleteFolder}
          onItemDrop={handleItemDrop}
        />
        <main className="notes-hub-main">
          <header className="notes-hub-header">
            <div>
              <h1>Notes Hub</h1>
              <p>Review saved problems, complete solutions, hints, and concept notes.</p>
            </div>
            <div className="notes-hub-header-controls">
              <div className="notes-hub-search-and-filters">
                <div className="notes-hub-search">
                  <input
                    type="search"
                    placeholder="Search saved notes..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search notes"
                  />
                </div>
                <div className="notes-hub-filters">
                  <button 
                    type="button" 
                    className={`filter-toggle ${showFilters ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters {hasActiveFilters && <span className="filter-indicator">●</span>}
                  </button>
                  
                  {showFilters && (
                    <div className="filter-dropdown">
                      <div className="filter-row">
                        <select 
                          value={activeFilters.type} 
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          aria-label="Filter by type"
                        >
                          <option value="">All Types</option>
                          {filterOptions.types.map(type => (
                            <option key={type} value={type}>
                              {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                        
                        <select 
                          value={activeFilters.subject} 
                          onChange={(e) => handleFilterChange('subject', e.target.value)}
                          aria-label="Filter by subject"
                        >
                          <option value="">All Subjects</option>
                          {filterOptions.subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                        
                        <select 
                          value={activeFilters.difficulty} 
                          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                          aria-label="Filter by difficulty"
                        >
                          <option value="">All Difficulties</option>
                          {filterOptions.difficulties.map(difficulty => (
                            <option key={difficulty} value={difficulty}>{difficulty}</option>
                          ))}
                        </select>
                        
                        <select 
                          value={activeFilters.tag} 
                          onChange={(e) => handleFilterChange('tag', e.target.value)}
                          aria-label="Filter by tag"
                        >
                          <option value="">All Tags</option>
                          {filterOptions.tags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                          ))}
                        </select>
                        
                        {hasActiveFilters && (
                          <button type="button" className="clear-filters" onClick={clearFilters}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="notes-hub-actions">
                <button type="button" onClick={handleCreateFolder}>New Folder</button>
                <button type="button" className="primary" onClick={handleSaveItem}>Save Item</button>
              </div>
            </div>
          </header>

          {loading && <div className="notes-hub-loading" role="status">Loading your learning library...</div>}
          {foldersError && <div className="notes-hub-inline-warning" role="status">{foldersError}</div>}
          {error && (
            <div className="notes-hub-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={fetchData}>Try again</button>
            </div>
          )}

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
                        onOpen={(item) => setViewingItem(item)}
                        onToggleStar={handleToggleStar}
                        onDeleteItem={handleDeleteItem}
                        className="compact"
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredItems.length ? (
                <>
                  <section className="notes-hub-grid">
                    {filteredItems.map((item) => (
                      <SavedItemCard
                        key={item.id}
                        item={item}
                        onOpen={(item) => setViewingItem(item)}
                        onToggleStar={handleToggleStar}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                  </section>
                  {pagination.page < pagination.pages && (
                    <div className="notes-hub-load-more">
                      <button type="button" onClick={loadMoreItems} disabled={loadingMore}>
                        {loadingMore ? 'Loading...' : `Load more (${savedItems.length} of ${pagination.total})`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <section className="notes-hub-empty" role="status">
                  <div className="notes-hub-empty__card">
                    <h2>{emptyStateTitle}</h2>
                    <p>{emptyStateBody}</p>
                    <button
                      type="button"
                      className="primary"
                      onClick={handleSaveItem}
                    >
                      Create your first item
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        {/* Folder Creation Modal */}
        {showFolderModal && (
          <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Folder</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowFolderModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <form
                className="modal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const folderData = {
                    name: formData.get('name'),
                    description: formData.get('description') || undefined
                  };
                  handleFolderSubmit(folderData);
                }}
              >
                <div className="form-group">
                  <label htmlFor="folder-name">Folder Name *</label>
                  <input
                    type="text"
                    id="folder-name"
                    name="name"
                    required
                    placeholder="Enter folder name"
                    maxLength="100"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="folder-description">Description</label>
                  <textarea
                    id="folder-description"
                    name="description"
                    placeholder="Optional description"
                    maxLength="500"
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowFolderModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Save Item Modal */}
        {showSaveItemModal && (
          <div className="modal-overlay" onClick={() => setShowSaveItemModal(false)}>
            <div className="modal-content save-item-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Save New Item</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowSaveItemModal(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="save-item-options">
                  <button
                    type="button"
                    className="save-item-option"
                    onClick={() => {
                      setShowSaveItemModal(false);
                      const currentFolderId = activeFolderId === 'all' ? null : activeFolderId;
                      const searchParams = new URLSearchParams({ create: 'true' });
                      if (currentFolderId) searchParams.set('folderId', currentFolderId);
                      navigate(`/solve-problems?${searchParams.toString()}`);
                    }}
                  >
                    <div className="option-icon"><FaFileAlt aria-hidden="true" /></div>
                    <div className="option-content">
                      <h3>Start with a problem</h3>
                      <p>Upload or type a question, then save its problem, solution, hints, and notes from the learning workspace.</p>
                    </div>
                    <FaArrowRight className="option-arrow" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Item Modal */}
        <ViewSavedItemModal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          savedItem={viewingItem}
          onDelete={handleDeleteItem}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          confirmText={confirmationModal.confirmText}
          confirmVariant={confirmationModal.confirmVariant}
        />
      </div>
    </div>
  );
};

export default NotesHubPage;
