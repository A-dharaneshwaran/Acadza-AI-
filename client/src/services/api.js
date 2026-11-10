const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal API fetch client
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API request failed with status ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return await response.json();
}

/**
 * Fetch backend health status
 */
export async function getBackendHealth() {
  return await apiRequest('/health');
}

export default {
  apiRequest,
  getBackendHealth,
  API_BASE_URL
};

