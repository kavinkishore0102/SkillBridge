// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Token validation utility (inline)
const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token === 'google-oauth-token') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Helper function to make API calls
const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  console.log('=== API CALL INITIATED ===');
  console.log('Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('Data:', data);

  // Validate token if provided (but don't block the request - let backend validate)
  if (token && !isValidToken(token)) {
    console.warn('Token validation failed on frontend, but sending to backend anyway');
    // Don't logout here - let the backend decide if token is invalid
  }

  console.log('Token valid:', token ? (isValidToken(token) ? 'Yes' : 'No (but sending anyway)') : 'No token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Full URL:', fullUrl);
  console.log('Config:', config);
  console.log('Authorization header:', token ? `Bearer ${token.substring(0, 20)}...` : 'None');

  try {
    console.log('Making fetch request...');
    const response = await fetch(fullUrl, config);
    console.log('Fetch response received:', response);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    console.log('Parsing response as JSON...');
    let result;
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    console.log('Parsed result:', result);

    if (!response.ok) {
      console.error('Response not OK:', response.status, result);
      const errorMessage = result.error || result.message || `API request failed with status ${response.status}`;

      // If 401, clear token and redirect
      if (response.status === 401) {
        console.error('401 Unauthorized - clearing token');
        utils.logout();
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(errorMessage);
    }

    console.log('=== API CALL SUCCESSFUL ===');
    return result;
  } catch (error) {
    console.error('=== API CALL ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Login with email and password
  login: async (email, password) => {
    return await apiCall('/login', 'POST', { email, password });
  },

  // Sign up new user
  signup: async (userData) => {
    return await apiCall('/signup', 'POST', userData);
  },

  // Get user profile
  getProfile: async (token) => {
    return await apiCall('/profile', 'GET', null, token);
  },

  // Update user profile
  updateProfile: async (userData, token) => {
    try {
      return await apiCall('/profile', 'PUT', userData, token);
    } catch (error) {
      // If token expired, try to refresh it
      if (error.message.includes('expired') || error.message.includes('Invalid or expired token')) {
        try {
          const refreshResponse = await apiCall('/refresh-token', 'POST', null, token);
          utils.saveToken(refreshResponse.token);
          // Retry with new token
          return await apiCall('/profile', 'PUT', userData, refreshResponse.token);
        } catch (refreshError) {
          // If refresh fails, user needs to login again
          utils.logout();
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      }
      throw error;
    }
  }
};

// Project API calls
export const projectAPI = {
  // Get all projects
  getAllProjects: async (token = null) => {
    return await apiCall('/projects', 'GET', null, token);
  },

  // Get project by ID
  getProjectById: async (projectId, token = null) => {
    return await apiCall(`/projects/${projectId}`, 'GET', null, token);
  },

  // Get project applicants (company only)
  getProjectApplicants: async (projectId, token) => {
    return await apiCall(`/projects/${projectId}/applicants`, 'GET', null, token);
  },

  // Apply to project (student only)
  applyToProject: async (projectId, token) => {
    return await apiCall('/projects/apply', 'POST', { project_id: projectId }, token);
  },

  // Withdraw application (student only)
  withdrawApplication: async (projectId, token) => {
    return await apiCall(`/projects/${projectId}/apply`, 'DELETE', null, token);
  },

  // Post new project (company only)
  postProject: async (projectData, token) => {
    return await apiCall('/projects', 'POST', projectData, token);
  },

  // Delete project (company only)
  deleteProject: async (projectId, token) => {
    return await apiCall(`/projects/${projectId}`, 'DELETE', null, token);
  }
};

// Guides API calls
export const guidesAPI = {
  // Get all guides (public)
  getAllGuides: async () => {
    return await apiCall('/guides', 'GET');
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // Get student dashboard
  getStudentDashboard: async (token) => {
    return await apiCall('/dashboard/student', 'GET', null, token);
  },

  // Get company dashboard
  getCompanyDashboard: async (token) => {
    return await apiCall('/dashboard/company', 'GET', null, token);
  },

  // Get guide dashboard
  getGuideDashboard: async (token) => {
    return await apiCall('/dashboard/guide', 'GET', null, token);
  },

  // Get my applications (student)
  getMyApplications: async (token) => {
    return await apiCall('/my-applications', 'GET', null, token);
  },

  // Get company applications
  getCompanyApplications: async (token) => {
    return await apiCall('/company/applications', 'GET', null, token);
  }
};

// Submission API calls
export const submissionAPI = {
  // Submit project (student only)
  submitProject: async (projectId, submissionData, token) => {
    return await apiCall(`/projects/${projectId}/submit`, 'POST', submissionData, token);
  },

  // Get my submissions (student)
  getMySubmissions: async (token) => {
    return await apiCall('/my-submissions', 'GET', null, token);
  },

  // Get project submissions (company only)
  getProjectSubmissions: async (projectId, token) => {
    return await apiCall(`/projects/${projectId}/submissions`, 'GET', null, token);
  },

  // Review submission (company only)
  reviewSubmission: async (submissionId, reviewData, token) => {
    return await apiCall(`/submissions/${submissionId}/review`, 'POST', reviewData, token);
  }
};

// Utility functions
export const utils = {
  // Save token to localStorage
  saveToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Check if user is logged in
  isLoggedIn: () => {
    const token = utils.getToken();
    return token && isValidToken(token);
  },

  // Save user data to localStorage
  saveUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  // Get user data from localStorage
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Remove user data from localStorage
  removeUser: () => {
    localStorage.removeItem('user');
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Chat API
export const chatAPI = {
  // Start a conversation with a guide
  startConversation: async (guideId) => {
    const token = utils.getToken();
    return apiCall('/chat/start', 'POST', { guide_id: guideId }, token);
  },

  // Send a message
  sendMessage: async (studentId, guideId, message) => {
    const token = utils.getToken();
    return apiCall('/chat/send', 'POST', {
      student_id: studentId,
      guide_id: guideId,
      message: message
    }, token);
  },

  // Get chat history between student and guide
  getChatHistory: async (studentId, guideId) => {
    const token = utils.getToken();
    return apiCall(`/chat/history/${studentId}/${guideId}`, 'GET', null, token);
  },

  // Get all conversations for current user
  getConversations: async () => {
    const token = utils.getToken();
    return apiCall('/chat/conversations', 'GET', null, token);
  },

  // Get connected guides for current student
  getConnectedGuides: async () => {
    const token = utils.getToken();
    return apiCall('/chat/connected-guides', 'GET', null, token);
  },

  // Get pending connection confirmations for a guide
  getPendingConfirmations: async () => {
    const token = utils.getToken();
    return apiCall('/guide/pending-confirmations', 'GET', null, token);
  },

  // Confirm (accept or reject) a connection request
  confirmConnection: async (requestId, action) => {
    const token = utils.getToken();
    return apiCall('/guide/confirm-connection', 'POST', {
      request_id: requestId,
      action: action  // 'accept' or 'reject'
    }, token);
  }
};
