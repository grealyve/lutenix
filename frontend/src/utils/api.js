const BASE_URL = 'http://localhost:4040/api/v1';

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const isTokenExpired = () => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > payload.exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  if (isTokenExpired()) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    return;
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return;
    }
    
    if (response.status === 204) {
      return { success: true };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

export const authAPI = {
  login: async (credentials) => {
    const response = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return response.json();
  },
  
  refreshToken: async () => {
    return apiCall('/users/refresh-token', { method: 'POST' });
  },
};

export const userAPI = {
  getProfile: () => apiCall('/users/profile'),

};

export const scanAPI = {
  getScans: () => apiCall('/scans'),
  getScanById: (id) => apiCall(`/scans/${id}`),
  createScan: (data) => apiCall('/scans', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

export default apiCall; 