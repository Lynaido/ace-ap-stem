// API utility functions for backend integration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh tokens
      ...options,
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 - try to refresh token
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        
        try {
          const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('accessToken', refreshData.accessToken);
            console.log('Token refreshed successfully');

            // Retry original request with new token
            config.headers.Authorization = `Bearer ${refreshData.accessToken}`;
            const retryResponse = await fetch(url, config);
            return this.handleResponse(retryResponse);
          } else {
            console.log('Token refresh failed');
            // Refresh failed, clear token and throw error 
            localStorage.removeItem('accessToken');
            throw new Error('Authentication failed - please log in again');
          }
        } catch (refreshError) {
          console.log('Token refresh request failed:', refreshError);
          localStorage.removeItem('accessToken');
          throw new Error('Authentication failed - please log in again');
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Authentication methods
  async login(credentials) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      return data;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      return data;
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      // Don't redirect immediately - let the toast show first
      // The redirect will happen after the toast is displayed
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Generic CRUD methods
  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Export individual methods for convenience
export const authAPI = {
  login: (credentials) => apiClient.login(credentials),
  register: (userData) => apiClient.register(userData),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),
};

export const problemAPI = {
  getAll: () => apiClient.get('/api/problems'),
  getById: (id) => apiClient.get(`/api/problems/${id}`),
  create: (problemData) => apiClient.post('/api/problems', problemData),
  update: (id, problemData) => apiClient.put(`/api/problems/${id}`, problemData),
  delete: (id) => apiClient.delete(`/api/problems/${id}`),
  generateSolution: (id, options = {}) => apiClient.post(`/api/problems/${id}/solutions`, options),
  generateHints: (id, options = {}) => apiClient.post(`/api/problems/${id}/hints`, options),
  generateConceptNotes: (id, options = {}) => apiClient.post(`/api/problems/${id}/concept-notes`, options),
  associateAssets: (id, assetIds) => apiClient.post(`/api/problems/${id}/assets`, { assetIds }),
};

export const foldersAPI = {
  getAll: () => apiClient.get('/api/folders'),
  getById: (id) => apiClient.get(`/api/folders/${id}`),
  create: (folderData) => apiClient.post('/api/folders', folderData),
  update: (id, folderData) => apiClient.put(`/api/folders/${id}`, folderData),
  delete: (id) => apiClient.delete(`/api/folders/${id}`),
};

export const notesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/notes?${queryString}` : '/api/notes';
    return apiClient.get(endpoint);
  },
  getById: (id) => apiClient.get(`/api/notes/${id}`),
  create: (noteData) => apiClient.post('/api/notes', noteData),
  update: (id, noteData) => apiClient.put(`/api/notes/${id}`, noteData),
  delete: (id) => apiClient.delete(`/api/notes/${id}`),
};

export const savedItemsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/saved-items?${queryString}` : '/api/saved-items';
    return apiClient.get(endpoint);
  },
  getById: (id) => apiClient.get(`/api/saved-items/${id}`),
  create: (savedItemData) => apiClient.post('/api/saved-items', savedItemData),
  update: (id, savedItemData) => apiClient.put(`/api/saved-items/${id}`, savedItemData),
  delete: (id) => apiClient.delete(`/api/saved-items/${id}`),
};

export const tagsAPI = {
  getAll: () => apiClient.get('/api/tags'),
  create: (tagData) => apiClient.post('/api/tags', tagData),
  delete: (id) => apiClient.delete(`/api/tags/${id}`),
};

export const studySessionsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/study-sessions?${queryString}` : '/api/study-sessions';
    return apiClient.get(endpoint);
  },
  getById: (id) => apiClient.get(`/api/study-sessions/${id}`),
  create: (sessionData) => apiClient.post('/api/study-sessions', sessionData),
  update: (id, sessionData) => apiClient.put(`/api/study-sessions/${id}`, sessionData),
  delete: (id) => apiClient.delete(`/api/study-sessions/${id}`),
  generateVariants: (id, variantData) => apiClient.post(`/api/study-sessions/${id}/variants`, variantData),
};

export const chatAPI = {
  // Create new thread
  createThread: async (data = {}) => {
    return apiClient.post('/api/chat/threads', data);
  },

  // Get all threads
  getThreads: async () => {
    return apiClient.get('/api/chat/threads');
  },

  // Get specific thread with messages
  getThread: async (threadId) => {
    return apiClient.get(`/api/chat/threads/${threadId}`);
  },

  // Send message
  sendMessage: async (threadId, content, problemId = null) => {
    return apiClient.post(`/api/chat/threads/${threadId}/messages`, {
      content,
      problemId,
    });
  },

  // Delete thread
  deleteThread: async (threadId) => {
    return apiClient.delete(`/api/chat/threads/${threadId}`);
  },

  // Get SSE stream URL
  getStreamUrl: (threadId) => {
    const token = localStorage.getItem('accessToken');
    return `${API_BASE_URL}/api/chat/threads/${threadId}/stream?token=${token}`;
  },
};

export default apiClient;
