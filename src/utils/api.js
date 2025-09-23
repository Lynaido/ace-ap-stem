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
        const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('accessToken', refreshData.accessToken);

          // Retry original request with new token
          config.headers.Authorization = `Bearer ${refreshData.accessToken}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        } else {
          // Refresh failed, clear token and throw error (don't redirect during initialization)
          localStorage.removeItem('accessToken');
          throw new Error('Authentication failed');
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
};

export const notesAPI = {
  getAll: () => apiClient.get('/api/notes'),
  getById: (id) => apiClient.get(`/api/notes/${id}`),
  create: (noteData) => apiClient.post('/api/notes', noteData),
  update: (id, noteData) => apiClient.put(`/api/notes/${id}`, noteData),
  delete: (id) => apiClient.delete(`/api/notes/${id}`),
};

export default apiClient;
