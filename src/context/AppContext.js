import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  authAPI,
  problemAPI,
  foldersAPI,
  notesAPI,
  savedItemsAPI,
  tagsAPI,
  studySessionsAPI
} from '../utils/api';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  // Authentication
  user: null,
  isAuthenticated: false,
  isAuthLoading: true, // Add loading state for authentication initialization

  // Active problem state
  currentProblem: null,
  activeProblem: null,
  activeSolution: null,
  activeHints: [],
  activeConceptNotes: null,
  displayMode: null, // 'solution', 'hints', 'concepts'

  // Chat state
  chatHistory: [],
  isChatOpen: false,

  // Notes Hub
  savedItems: [],
  folders: [
    { id: 'all', name: 'All Items', count: 0 },
    { id: 'problems', name: 'Problems', count: 0 },
    { id: 'chats', name: 'Chat History', count: 0 },
    { id: 'concepts', name: 'Concept Notes', count: 0 }
  ],
  activeFolder: 'all',

  // Study Mode
  selectedProblemForStudy: null,
  generatedVariants: [],

  // UI State
  loading: false,
  error: null,

  //Persisting data
  problemSolution: null,
  problemHints: [],
  problemConceptNotes: null,
  isProblemLoading: false,
  problemDisplayMode: null,
  isProblemViewVisible: false,
};

// Action types
const ActionTypes = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',

  // Problem actions
  SET_ACTIVE_PROBLEM: 'SET_ACTIVE_PROBLEM',
  SUBMIT_PROBLEM: 'SUBMIT_PROBLEM',
  GENERATE_SOLUTION: 'GENERATE_SOLUTION',
  GENERATE_HINTS: 'GENERATE_HINTS',
  GENERATE_CONCEPT_NOTES: 'GENERATE_CONCEPT_NOTES',
  SET_SOLUTION: 'SET_SOLUTION',
  ADD_HINT: 'ADD_HINT',
  RESET_HINTS: 'RESET_HINTS',
  SET_CONCEPT_NOTES: 'SET_CONCEPT_NOTES',
  CLEAR_ACTIVE_PROBLEM: 'CLEAR_ACTIVE_PROBLEM',
  CLEAR_CURRENT_PROBLEM: 'CLEAR_CURRENT_PROBLEM',

  // Chat actions
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  CLEAR_CHAT: 'CLEAR_CHAT',
  TOGGLE_CHAT: 'TOGGLE_CHAT',

  // Notes Hub actions
  SAVE_ITEM: 'SAVE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  SET_ACTIVE_FOLDER: 'SET_ACTIVE_FOLDER',

  // Study Mode actions
  SELECT_PROBLEM_FOR_STUDY: 'SELECT_PROBLEM_FOR_STUDY',
  SET_GENERATED_VARIANTS: 'SET_GENERATED_VARIANTS',

  // UI actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Persisting data actions
  SET_PROBLEM_SOLUTION: 'SET_PROBLEM_SOLUTION',
  SET_PROBLEM_HINTS: 'SET_PROBLEM_HINTS',
  SET_PROBLEM_CONCEPT_NOTES: 'SET_PROBLEM_CONCEPT_NOTES',
  SET_IS_PROBLEM_LOADING: 'SET_IS_PROBLEM_LOADING',
  SET_PROBLEM_DISPLAY_MODE: 'SET_PROBLEM_DISPLAY_MODE',
  CLEAR_PROBLEM_STATE: 'CLEAR_PROBLEM_STATE',
  SET_PROBLEM_VIEW_VISIBLE: 'SET_PROBLEM_VIEW_VISIBLE'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOGIN:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isAuthLoading: false,
        error: null
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        user: null,
        isAuthenticated: false,
        isAuthLoading: false,
      };

    case ActionTypes.SET_AUTH_LOADING:
      return {
        ...state,
        isAuthLoading: action.payload
      };

    case ActionTypes.SET_ACTIVE_PROBLEM:
      return {
        ...state,
        activeProblem: action.payload,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        error: null
      };

    case ActionTypes.SET_SOLUTION:
      return {
        ...state,
        activeSolution: action.payload
      };

    case ActionTypes.ADD_HINT:
      return {
        ...state,
        activeHints: [...state.activeHints, action.payload]
      };

    case ActionTypes.RESET_HINTS:
      return {
        ...state,
        activeHints: []
      };

    case ActionTypes.SET_CONCEPT_NOTES:
      return {
        ...state,
        activeConceptNotes: action.payload
      };

    case ActionTypes.SUBMIT_PROBLEM:
      return {
        ...state,
        currentProblem: action.payload,
        activeProblem: action.payload,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        displayMode: null,
        error: null
      };

    case ActionTypes.GENERATE_SOLUTION:
      return {
        ...state,
        activeSolution: action.payload.solution,
        displayMode: 'solution'
      };

    case ActionTypes.GENERATE_HINTS:
      return {
        ...state,
        activeHints: action.payload,
        displayMode: 'hints'
      };

    case ActionTypes.GENERATE_CONCEPT_NOTES:
      return {
        ...state,
        activeConceptNotes: action.payload,
        displayMode: 'concepts'
      };

    case ActionTypes.CLEAR_CURRENT_PROBLEM:
      return {
        ...state,
        currentProblem: null,
        activeProblem: null,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        displayMode: null
      };

    case ActionTypes.CLEAR_ACTIVE_PROBLEM:
      return {
        ...state,
        activeProblem: null,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        displayMode: null
      };

    case ActionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload]
      };

    case ActionTypes.CLEAR_CHAT:
      return {
        ...state,
        chatHistory: []
      };

    case ActionTypes.TOGGLE_CHAT:
      return {
        ...state,
        isChatOpen: !state.isChatOpen
      };

    case ActionTypes.SAVE_ITEM:
      const newItem = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      // Update folder counts
      const updatedFolders = state.folders.map(folder => {
        if (folder.id === 'all' || folder.id === newItem.type) {
          return { ...folder, count: folder.count + 1 };
        }
        return folder;
      });

      return {
        ...state,
        savedItems: [...state.savedItems, newItem],
        folders: updatedFolders
      };

    case ActionTypes.DELETE_ITEM:
      const itemToDelete = state.savedItems.find(item => item.id === action.payload);
      const filteredItems = state.savedItems.filter(item => item.id !== action.payload);

      // Update folder counts
      const updatedFoldersAfterDelete = state.folders.map(folder => {
        if (folder.id === 'all' || (itemToDelete && folder.id === itemToDelete.type)) {
          return { ...folder, count: Math.max(0, folder.count - 1) };
        }
        return folder;
      });

      return {
        ...state,
        savedItems: filteredItems,
        folders: updatedFoldersAfterDelete
      };

    case ActionTypes.SET_ACTIVE_FOLDER:
      return {
        ...state,
        activeFolder: action.payload
      };

    case ActionTypes.SELECT_PROBLEM_FOR_STUDY:
      return {
        ...state,
        selectedProblemForStudy: action.payload,
        generatedVariants: []
      };

    case ActionTypes.SET_GENERATED_VARIANTS:
      return {
        ...state,
        generatedVariants: action.payload
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    // Persisting data reducer cases
    case ActionTypes.SET_PROBLEM_SOLUTION:
      return {
        ...state,
        problemSolution: action.payload,
        isProblemLoading: false,
        problemDisplayMode: 'solution'
      };
    case ActionTypes.SET_PROBLEM_HINTS:
      return {
        ...state,
        problemHints: action.payload,
        isProblemLoading: false,
        problemDisplayMode: 'hints'
      };
    case ActionTypes.SET_PROBLEM_CONCEPT_NOTES:
      return {
        ...state,
        problemConceptNotes: action.payload,
        isProblemLoading: false,
        problemDisplayMode: 'concepts'
      };
    case ActionTypes.SET_IS_PROBLEM_LOADING:
      return {
        ...state,
        isProblemLoading: action.payload
      };
    case ActionTypes.SET_PROBLEM_DISPLAY_MODE:
      return {
        ...state,
        problemDisplayMode: action.payload
      };
    case ActionTypes.CLEAR_PROBLEM_STATE:
      return {
        ...state,
        currentProblem: null,
        problemSolution: null,
        problemHints: [],
        problemConceptNotes: null,
        isProblemLoading: false,
        problemDisplayMode: null,
        isProblemViewVisible: false,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        displayMode: null
      };

    case ActionTypes.SET_PROBLEM_VIEW_VISIBLE:
      return {
        ...state,
        isProblemViewVisible: action.payload
      };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');

      // Only try to get user data if we have a token
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          dispatch({ type: ActionTypes.LOGIN, payload: userData.user });
        } catch (error) {
          console.log('Authentication check error:', error.message);
          
          // Check if it's an authentication failure (token invalid/expired)
          if (error.message.includes('Authentication failed') || 
              error.message.includes('please log in again') ||
              error.message.includes('401')) {
            console.log('Authentication failed, logging out');
            localStorage.removeItem('accessToken');
            dispatch({ type: ActionTypes.LOGOUT });
          } else {
            // Network error or other issue - assume user is still authenticated
            console.log('Network error during auth check, keeping user logged in');
            // For now, just stop loading - user remains in logged-in state with existing token
            dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: false });
            
            // Set some basic user state if we have a token but can't verify
            const existingUser = localStorage.getItem('user');
            if (existingUser) {
              try {
                const parsedUser = JSON.parse(existingUser);
                dispatch({ type: ActionTypes.LOGIN, payload: parsedUser });
              } catch (parseError) {
                dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: false });
              }
            } else {
              dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: false });
            }
          }
        }
      } else {
        // No token found, set loading to false
        dispatch({ type: ActionTypes.LOGOUT });
      }
    };

    // Add a timeout to prevent infinite loading - only if no token
    const timeout = setTimeout(() => {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
        dispatch({ type: ActionTypes.LOGOUT });
      } else {
        // If we have a token, just stop loading without logging out
        dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: false });
      }
    }, 10000); // Increased from 3 seconds to 10 seconds

    initializeAuth();

    // Clear timeout when component unmounts or effect runs again
    return () => clearTimeout(timeout);
  }, []);

  // Async authentication functions
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authAPI.login(credentials);
      
      // Store user data in localStorage for offline resilience
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({ type: ActionTypes.LOGIN, payload: response.user });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      // Show success toast
      toast.success('Logged In', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authAPI.register(userData);
      dispatch({ type: ActionTypes.LOGIN, payload: response.user });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      // Show success toast
      toast.success('Registered Successfully', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      
      // Clear stored user data
      localStorage.removeItem('user');
      
      dispatch({ type: ActionTypes.LOGOUT });

      // Redirect immediately to sign-in page
      if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
        window.location.href = '/sign-in?logout=success';
      }
    } catch (error) {
      // Even if API call fails, clear local state
      localStorage.removeItem('user');
      dispatch({ type: ActionTypes.LOGOUT });

      // Redirect immediately to sign-in page
      if (window.location.pathname !== '/sign-in' && window.location.pathname !== '/sign-up') {
        window.location.href = '/sign-in?logout=success';
      }
    }
  }, []);

  // API integration functions
  const createProblem = useCallback(async (problemData, folderId = null) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await problemAPI.create(problemData);
      console.log('Problem created successfully:', response.data);
      dispatch({ type: ActionTypes.SUBMIT_PROBLEM, payload: response.data });

      // Automatically save the problem as a saved item
      console.log('Attempting to save problem as saved item...');
      try {
        const savedItemData = {
          type: 'PROBLEM',
          problemId: response.data.id,
          folderId: folderId || undefined,
          starred: false,
          tags: [response.data.subject, response.data.difficulty]
        };

        console.log('Saving item with data:', savedItemData);
        const savedItemResponse = await savedItemsAPI.create(savedItemData);
        console.log('Saved item created successfully:', savedItemResponse);
        
        // Small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (saveError) {
        console.error('Error saving problem as saved item:', saveError);
        console.error('Error details:', saveError.message);
        // Still show success toast for problem creation even if saving as item fails
        toast.error(`Problem created but failed to save to library: ${saveError.message}. Please refresh the Notes Hub.`, {
          position: "top-right",
          autoClose: 7000,
        });
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Problem created and saved to your library!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getProblems = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await problemAPI.getAll();
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getProblemById = useCallback(async (id) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await problemAPI.getById(id);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const updateProblem = useCallback(async (id, problemData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await problemAPI.update(id, problemData);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Problem updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const deleteProblem = useCallback(async (id) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      await problemAPI.delete(id);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Problem deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const uploadFile = useCallback(async (file, problemId = null, description = '') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const formData = new FormData();
      formData.append('file', file);

      if (problemId) {
        formData.append('problemId', problemId);
      }

      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('File uploaded successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return data.data;
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  // Folders API functions
  const createFolder = useCallback(async (folderData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await foldersAPI.create(folderData);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Folder created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getFolders = useCallback(async () => {
    try {
      const response = await foldersAPI.getAll();
      return response.data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  }, []);

  const deleteFolder = useCallback(async (folderId) => {
    try {
      await foldersAPI.delete(folderId);
      // No need to dispatch, folder list is refetched in NotesHubPage
      toast.success('Folder deleted successfully!');
    } catch (error) {
      toast.error(`Failed to delete folder: ${error.message}`);
      throw error;
    }
  }, []);

  // Notes API functions
  const createNote = useCallback(async (noteData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await notesAPI.create(noteData);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Note created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getNotes = useCallback(async (params = {}) => {
    try {
      const response = await notesAPI.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }, []);

  // Saved Items API functions
  const saveItem = useCallback(async (itemData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await savedItemsAPI.create(itemData);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Item saved successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getSavedItems = useCallback(async (params = {}) => {
    try {
      const response = await savedItemsAPI.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved items:', error);
      throw error;
    }
  }, []);

  const deleteSavedItem = useCallback(async (itemId) => {
    try {
      await savedItemsAPI.delete(itemId);
      dispatch({ type: ActionTypes.DELETE_ITEM, payload: itemId });
      toast.success('Item deleted successfully!');
    } catch (error) {
      toast.error(`Failed to delete item: ${error.message}`);
      throw error;
    }
  }, []);

  // Tags API functions
  const createTag = useCallback(async (tagData) => {
    try {
      const response = await tagsAPI.create(tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }, []);

  const getTags = useCallback(async () => {
    try {
      const response = await tagsAPI.getAll();
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }, []);

  // Study Sessions API functions
  const createStudySession = useCallback(async (sessionData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await studySessionsAPI.create(sessionData);
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      toast.success('Study session created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      return response.data;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, []);

  const getStudySessions = useCallback(async (params = {}) => {
    try {
      const response = await studySessionsAPI.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching study sessions:', error);
      throw error;
    }
  }, []);

  const getSubjects = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/subjects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subjects');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }, []);

  // Action creators
  const actions = {
    // Auth actions
    login,
    register,
    logout,

    // Problem actions
    setActiveProblem: (problem) => dispatch({ type: ActionTypes.SET_ACTIVE_PROBLEM, payload: problem }),
    submitProblem: (problem) => dispatch({ type: ActionTypes.SUBMIT_PROBLEM, payload: problem }),
    generateSolution: (solutionData) => dispatch({ type: ActionTypes.GENERATE_SOLUTION, payload: solutionData }),
    generateHints: (hints) => dispatch({ type: ActionTypes.GENERATE_HINTS, payload: hints }),
    generateConceptNotes: (notes) => dispatch({ type: ActionTypes.GENERATE_CONCEPT_NOTES, payload: notes }),
    setSolution: (solution) => dispatch({ type: ActionTypes.SET_SOLUTION, payload: solution }),
    addHint: (hint) => dispatch({ type: ActionTypes.ADD_HINT, payload: hint }),
    resetHints: () => dispatch({ type: ActionTypes.RESET_HINTS }),
    setConceptNotes: (notes) => dispatch({ type: ActionTypes.SET_CONCEPT_NOTES, payload: notes }),
    clearActiveProblem: () => dispatch({ type: ActionTypes.CLEAR_ACTIVE_PROBLEM }),
    clearCurrentProblem: () => dispatch({ type: ActionTypes.CLEAR_CURRENT_PROBLEM }),

    // API integration actions
    createProblem,
    getProblems,
    getProblemById,
    updateProblem,
    deleteProblem,
    uploadFile,
    getSubjects,

    // Folders API actions
    createFolder,
    getFolders,
    deleteFolder,

    // Notes API actions
    createNote,
    getNotes,

    // Saved Items API actions
    saveItem,
    getSavedItems,
    deleteSavedItem,

    // Tags API actions
    createTag,
    getTags,

    // Study Sessions API actions
    createStudySession,
    getStudySessions,

    // Chat actions
    addChatMessage: (message) => dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message }),
    clearChat: () => dispatch({ type: ActionTypes.CLEAR_CHAT }),
    toggleChat: () => dispatch({ type: ActionTypes.TOGGLE_CHAT }),

    // Notes Hub actions
    deleteItem: (itemId) => dispatch({ type: ActionTypes.DELETE_ITEM, payload: itemId }),
    setActiveFolder: (folderId) => dispatch({ type: ActionTypes.SET_ACTIVE_FOLDER, payload: folderId }),

    // Study Mode actions
    selectProblemForStudy: (problem) => dispatch({ type: ActionTypes.SELECT_PROBLEM_FOR_STUDY, payload: problem }),
    setGeneratedVariants: (variants) => dispatch({ type: ActionTypes.SET_GENERATED_VARIANTS, payload: variants }),

    // UI actions
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),

    // Persisting data actions
    setProblemSolution: (solution) => dispatch({ type: ActionTypes.SET_PROBLEM_SOLUTION, payload: solution }),
    setProblemHints: (hints) => dispatch({ type: ActionTypes.SET_PROBLEM_HINTS, payload: hints }),
    setProblemConceptNotes: (notes) => dispatch({ type: ActionTypes.SET_PROBLEM_CONCEPT_NOTES, payload: notes }),
    setIsProblemLoading: (loading) => dispatch({ type: ActionTypes.SET_IS_PROBLEM_LOADING, payload: loading }),
    setProblemDisplayMode: (mode) => dispatch({ type: ActionTypes.SET_PROBLEM_DISPLAY_MODE, payload: mode }),
    clearProblemState: () => dispatch({ type: ActionTypes.CLEAR_PROBLEM_STATE }),
    setProblemViewVisible: (visible) => dispatch({ type: ActionTypes.SET_PROBLEM_VIEW_VISIBLE, payload: visible })
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
