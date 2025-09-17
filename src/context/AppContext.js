import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  // Authentication
  user: null,
  isAuthenticated: false,
  
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
  error: null
};

// Action types
const ActionTypes = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
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
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOGIN:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        error: null
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        activeProblem: null,
        activeSolution: null,
        activeHints: [],
        activeConceptNotes: null,
        chatHistory: [],
        isChatOpen: false
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
  
  // Action creators
  const actions = {
    // Auth actions
    login: (userData) => dispatch({ type: ActionTypes.LOGIN, payload: userData }),
    logout: () => dispatch({ type: ActionTypes.LOGOUT }),
    
    // Problem actions
    setActiveProblem: (problem) => dispatch({ type: ActionTypes.SET_ACTIVE_PROBLEM, payload: problem }),
    submitProblem: (problem) => dispatch({ type: ActionTypes.SUBMIT_PROBLEM, payload: problem }),
    generateSolution: (solutionData) => dispatch({ type: ActionTypes.GENERATE_SOLUTION, payload: solutionData }),
    setSolution: (solution) => dispatch({ type: ActionTypes.SET_SOLUTION, payload: solution }),
    addHint: (hint) => dispatch({ type: ActionTypes.ADD_HINT, payload: hint }),
    resetHints: () => dispatch({ type: ActionTypes.RESET_HINTS }),
    setConceptNotes: (notes) => dispatch({ type: ActionTypes.SET_CONCEPT_NOTES, payload: notes }),
    clearActiveProblem: () => dispatch({ type: ActionTypes.CLEAR_ACTIVE_PROBLEM }),
    clearCurrentProblem: () => dispatch({ type: ActionTypes.CLEAR_CURRENT_PROBLEM }),
    
    // Chat actions
    addChatMessage: (message) => dispatch({ type: ActionTypes.ADD_CHAT_MESSAGE, payload: message }),
    clearChat: () => dispatch({ type: ActionTypes.CLEAR_CHAT }),
    toggleChat: () => dispatch({ type: ActionTypes.TOGGLE_CHAT }),
    
    // Notes Hub actions
    saveItem: (item) => dispatch({ type: ActionTypes.SAVE_ITEM, payload: item }),
    deleteItem: (itemId) => dispatch({ type: ActionTypes.DELETE_ITEM, payload: itemId }),
    setActiveFolder: (folderId) => dispatch({ type: ActionTypes.SET_ACTIVE_FOLDER, payload: folderId }),
    
    // Study Mode actions
    selectProblemForStudy: (problem) => dispatch({ type: ActionTypes.SELECT_PROBLEM_FOR_STUDY, payload: problem }),
    setGeneratedVariants: (variants) => dispatch({ type: ActionTypes.SET_GENERATED_VARIANTS, payload: variants }),
    
    // UI actions
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR })
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