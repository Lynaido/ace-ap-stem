// API utility functions for backend integration
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/backend'
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001');

// API endpoints historically returned both `{ error: 'message' }` and
// `{ error: { message: 'message' } }`.  Read only explicitly public message
// fields so an error object never reaches the UI as `[object Object]` (and do
// not fall back to internal fields such as a stack trace).
const readPublicErrorMessage = (value, depth = 0) => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object' || depth >= 3) {
    return '';
  }

  return (
    readPublicErrorMessage(value.message, depth + 1) ||
    readPublicErrorMessage(value.error, depth + 1) ||
    readPublicErrorMessage(value.data, depth + 1)
  );
};

export const getApiErrorMessage = (payload, fallback) => (
  readPublicErrorMessage(payload?.error) ||
  readPublicErrorMessage(payload?.message) ||
  readPublicErrorMessage(payload?.data) ||
  fallback
);

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.refreshPromise = null;
  }

  notifyAuthenticationExpired() {
    localStorage.removeItem('accessToken');
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }

  async refreshAccessToken() {
    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Your session has expired. Please sign in again.');
          }

          const data = await response.json();
          localStorage.setItem('accessToken', data.accessToken);
          return data.accessToken;
        })
        .catch((error) => {
          this.notifyAuthenticationExpired();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
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
        try {
          const refreshedToken = await this.refreshAccessToken();
          config.headers.Authorization = `Bearer ${refreshedToken}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } catch (refreshError) {
          throw refreshError;
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
      throw new Error(getApiErrorMessage(data, `HTTP error! status: ${response.status}`));
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
      throw new Error(getApiErrorMessage(data, 'Login failed'));
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
      throw new Error(getApiErrorMessage(data, 'Registration failed'));
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
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

  async restoreSession() {
    await this.refreshAccessToken();
    return this.getCurrentUser();
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
  restoreSession: () => apiClient.restoreSession(),
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, 'Failed to send password reset email'));
    }

    return data;
  },
  resetPassword: async (token, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, 'Failed to reset password'));
    }

    return data;
  },
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
  detectStructure: (id) => apiClient.post(`/api/problems/${id}/structure`, {}),
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

  // Problems the student can ask the tutor about, with their latest conversation
  getTutorProblems: async () => {
    return apiClient.get('/api/chat/problems');
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

export const contactAPI = {
  submitMessage: (contactData) => apiClient.post('/api/contact', contactData),
};

export const companionAPI = {
  getProfile: () => apiClient.get('/api/companion'),
  updateProfile: (update) => apiClient.put('/api/companion', update),
};

export default apiClient;
