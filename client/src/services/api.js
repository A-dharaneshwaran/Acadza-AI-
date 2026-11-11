const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Universal API fetch client
 */
export async function apiRequest(endpoint, options = {}) {
  // Normalize base and endpoint to prevent duplicate slashes or malformed paths
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkError) {
    // Distinguish low-level network/CORS failure from HTTP status responses
    const error = new Error(`Network failure connecting to ${url}: ${networkError.message}. Check backend status & CORS.`);
    error.isNetworkError = true;
    error.originalError = networkError;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP ${response.status} from ${cleanEndpoint}`);
    error.status = response.status;
    error.data = errorData;
    error.isHttpError = true;
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

