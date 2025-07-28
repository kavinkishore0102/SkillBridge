import './css/signup.css';

import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; // Keep this line from Stashed changes
import { authAPI, utils } from './utils/api'; // Keep this line from Stashed changes
  
function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student' // Default role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
    const [googleUserInfo, setGoogleUserInfo] = useState(null);
    const [googleCredential, setGoogleCredential] = useState(null);
    const [selectedGoogleRole, setSelectedGoogleRole] = useState('student');

    // Keep this entire block from Stashed changes
    useEffect(() => {
        // Check if user is already logged in
        if (utils.isLoggedIn()) {
            navigate('/dashboard');
        }

        // Initialize Google Sign-In when component mounts
        const initializeGoogleSignIn = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: '694389954977-6m3ksdmkph01bmn98skfuac3mrvhaumu.apps.googleusercontent.com',
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                
                // Render the Google button
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signup-button'),
                    {
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        shape: 'rectangular',
                        width: 250
                    }
                );
            }
        };

        // Check if Google script is already loaded
        if (window.google) {
            initializeGoogleSignIn();
        } else {
            // Wait for Google script to load
            const checkGoogleLoaded = setInterval(() => {
                if (window.google) {
                    initializeGoogleSignIn();
                    clearInterval(checkGoogleLoaded);
                }
            }, 100);
        }
    }, [navigate]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle traditional signup form submission
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        console.log('=== SIGNUP FORM SUBMISSION STARTED ===');
        console.log('Form data:', formData);
        console.log('API_BASE_URL:', 'http://localhost:8080/api');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            console.log('Password validation failed: passwords do not match');
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            console.log('=== SENDING SIGNUP REQUEST ===');
            console.log('userData:', userData);
            console.log('About to call authAPI.signup...');
            
            const response = await authAPI.signup(userData);
            console.log('=== SIGNUP RESPONSE RECEIVED ===');
            console.log('Signup response:', response);
            
            // Save token
            console.log('Saving token:', response.token);
            utils.saveToken(response.token);
            
            // Get user profile
            console.log('Getting user profile...');
            const userProfile = await authAPI.getProfile(response.token);
            console.log('User profile:', userProfile);
            utils.saveUser(userProfile);
            
            // Redirect to dashboard
            console.log('Redirecting to dashboard...');
            navigate('/dashboard');
        } catch (error) {
            console.error('=== SIGNUP ERROR ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            setError(error.message || 'Signup failed. Please try again.');
        } finally {
            console.log('=== SIGNUP PROCESS COMPLETED ===');
            setLoading(false);
        }
    };

    // Handle Google OAuth response
    const handleCredentialResponse = async (response) => {
        try {
            // Parse the JWT token
            const userInfo = parseJwt(response.credential);
            console.log('Google user info:', userInfo);
            
            if (userInfo) {
                // Store user info temporarily and show role selection modal
                setGoogleUserInfo(userInfo);
                setGoogleCredential(response.credential); // Store the credential
                setShowGoogleRoleModal(true);
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            setError('Google authentication failed: ' + error.message);
        }
    };

    // Handle Google OAuth role selection
    const handleGoogleRoleSelection = async () => {
        if (!googleUserInfo || !googleCredential) return;

        setLoading(true);
        setError('');

        try {
            console.log('=== GOOGLE OAUTH SIGNUP ===');
            console.log('Selected role:', selectedGoogleRole);
            
            // Send Google token to backend for verification and JWT generation
            const response = await fetch('http://localhost:8080/api/google-oauth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    google_token: googleCredential,
                    role: selectedGoogleRole
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Google OAuth signup successful:', data);
                
                // Save the proper JWT token
                utils.saveToken(data.token);
                
                // Save user data
                utils.saveUser(data.user);
                
                // Close modal and redirect
                setShowGoogleRoleModal(false);
                navigate('/dashboard');
            } else {
                setError(data.error || 'Google authentication failed');
            }
        } catch (error) {
            console.error('Google OAuth signup error:', error);
            setError('Google authentication failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel Google OAuth role selection
    const handleCancelGoogleRoleSelection = () => {
        setShowGoogleRoleModal(false);
        setGoogleUserInfo(null);
        setSelectedGoogleRole('student');
        setError('');
    };

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error parsing JWT:', e);
            return null;
        }
    };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <h2>Welcome to SkillBridge</h2>
        <p>
          We are so excited to have you here. If you haven't already, create an account to get
          valuable learning and real-time project experiences.
        </p>
        <button className="signin-link" onClick={() => navigate('/')}>Already have an account? Signin.</button>
      </div>

      <div className="signup-right">
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src="/logo.svg" 
            alt="SkillBridge Logo" 
            style={{ 
              width: '150px', 
              height: 'auto',
              marginBottom: '10px'
            }} 
          />
        </div>
        <h2>Signup</h2>
        <form onSubmit={handleSignupSubmit}>
          <input 
            type="text" 
            name="name"
            placeholder="Full Name" 
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <input 
            type="email" 
            name="email"
            placeholder="Email" 
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <input 
            type="password" 
            name="confirmPassword"
            placeholder="Confirm Password" 
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
          <select 
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          >
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="guide">Guide</option>
          </select>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Signup'}
          </button>
        </form>
        <p className="social-text">or signup with</p>
        <div className="social-icons">
          {/* This div is where the Google button will be rendered by the GIS library */}
          <div id="google-signup-button"></div>
          {/* <i className="fab fa-facebook-f"></i> */} {/* Assuming you might remove these if only using Google */}
          {/* <i className="fab fa-google-plus-g"></i> */}
          {/* <i className="fab fa-linkedin-in"></i> */}
        </div>
      </div>

      {/* Google OAuth Role Selection Modal */}
      {showGoogleRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select Your Role</h3>
            <p>Hi {googleUserInfo?.name}! Please select your role to complete your signup:</p>
            
            <div className="role-selection">
              <label className="role-option">
                <input
                  type="radio"
                  name="googleRole"
                  value="student"
                  checked={selectedGoogleRole === 'student'}
                  onChange={(e) => setSelectedGoogleRole(e.target.value)}
                />
                <span className="role-label">
                  <strong>Student</strong>
                  <br />
                  <small>Looking for projects and learning opportunities</small>
                </span>
              </label>

              <label className="role-option">
                <input
                  type="radio"
                  name="googleRole"
                  value="company"
                  checked={selectedGoogleRole === 'company'}
                  onChange={(e) => setSelectedGoogleRole(e.target.value)}
                />
                <span className="role-label">
                  <strong>Company</strong>
                  <br />
                  <small>Posting projects and hiring students</small>
                </span>
              </label>

              <label className="role-option">
                <input
                  type="radio"
                  name="googleRole"
                  value="guide"
                  checked={selectedGoogleRole === 'guide'}
                  onChange={(e) => setSelectedGoogleRole(e.target.value)}
                />
                <span className="role-label">
                  <strong>Guide</strong>
                  <br />
                  <small>Mentoring and guiding students</small>
                </span>
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={handleCancelGoogleRoleSelection}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleGoogleRoleSelection}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Signup;