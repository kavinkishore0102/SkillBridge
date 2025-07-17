// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to make API calls
const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  console.log('=== API CALL INITIATED ===');
  console.log('Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('Data:', data);
  console.log('Token:', token);

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

  try {
    console.log('Making fetch request...');
    const response = await fetch(fullUrl, config);
    console.log('Fetch response received:', response);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    console.log('Parsing response as JSON...');
    const result = await response.json();
    console.log('Parsed result:', result);

    if (!response.ok) {
      console.error('Response not OK:', response.status, result);
      throw new Error(result.error || 'API request failed');
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
    return await apiCall('/profile', 'PUT', userData, token);
  }
};

// Project API calls
export const projectAPI = {
  // Get all projects
  getAllProjects: async () => {
    return await apiCall('/projects', 'GET');
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
    return !!localStorage.getItem('token');
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
