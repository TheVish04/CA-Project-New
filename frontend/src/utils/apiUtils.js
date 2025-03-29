import axios from 'axios';

/**
 * Utility for making API calls with consistent error handling
 */
const apiUtils = {
  /**
   * Get the base API URL from environment variables or use default
   * @returns {string} The API base URL without trailing slash
   */
  getApiBaseUrl: () => {
    let apiUrl = import.meta.env.VITE_API_URL || 'https://ca-project-new.onrender.com';
    // Remove trailing slash if it exists
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    return apiUrl;
  },

  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint (without leading slash)
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Axios response promise
   */
  get: async (endpoint, options = {}) => {
    const apiUrl = apiUtils.getApiBaseUrl();
    const url = `${apiUrl}/${endpoint}`;
    
    const defaultOptions = {
      timeout: 30000,
      headers: { 
        'Content-Type': 'application/json'
      },
      withCredentials: false
    };

    try {
      console.log(`Making GET request to: ${url}`);
      return await axios.get(url, { ...defaultOptions, ...options });
    } catch (error) {
      console.error(`Error in GET ${url}:`, error);
      throw apiUtils.handleError(error);
    }
  },

  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint (without leading slash)
   * @param {Object} data - Request data
   * @param {Object} options - Additional axios options
   * @returns {Promise} - Axios response promise
   */
  post: async (endpoint, data, options = {}) => {
    const apiUrl = apiUtils.getApiBaseUrl();
    const url = `${apiUrl}/${endpoint}`;
    
    const defaultOptions = {
      timeout: 30000,
      headers: { 
        'Content-Type': 'application/json'
      },
      withCredentials: false
    };

    try {
      console.log(`Making POST request to: ${url}`);
      return await axios.post(url, data, { ...defaultOptions, ...options });
    } catch (error) {
      console.error(`Error in POST ${url}:`, error);
      throw apiUtils.handleError(error);
    }
  },

  /**
   * Handle and standardize error responses
   * @param {Error} error - The error from axios
   * @returns {Object} - Standardized error object
   */
  handleError: (error) => {
    // Network or connection error
    if (error.code === 'ERR_NETWORK') {
      return {
        isNetworkError: true,
        message: 'Network error. Please check your internet connection and try again.',
        originalError: error
      };
    }
    
    // Server responded with an error
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.error || 'Server error occurred',
        redirect: error.response.data?.redirect,
        originalError: error
      };
    }
    
    // Request was made but no response received (timeout, etc)
    if (error.request) {
      return {
        isRequestError: true,
        message: 'No response received from server. Please try again later.',
        originalError: error
      };
    }
    
    // Something else happened while setting up the request
    return {
      isUnknownError: true,
      message: error.message || 'An unknown error occurred',
      originalError: error
    };
  }
};

export default apiUtils; 