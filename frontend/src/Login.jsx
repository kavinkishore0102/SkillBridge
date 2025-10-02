import './css/login.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'; // Keep this line from Stashed changes
import { authAPI, utils } from './utils/api'; // Keep this line from Stashed changes

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Clear any invalid tokens first
        const token = utils.getToken();
        if (token && (token === 'google-oauth-token' || token.startsWith('google-oauth-token'))) {
            console.log('Clearing invalid Google OAuth token');
            utils.clearAuth();
        }
        
        // Check if user is already logged in
        const isLoggedIn = utils.isLoggedIn();
        const validToken = utils.getToken();
        const user = utils.getUser();
        
        if (isLoggedIn && validToken && user && !validToken.startsWith('google-oauth-token')) {
            navigate('/dashboard');
        }

        // Initialize Google Sign-In when component mounts
        const initializeGoogleSignIn = () => {
            if (window.google && window.google.accounts) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '694389954977-6m3ksdmkph01bmn98skfuac3mrvhaumu.apps.googleusercontent.com',
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                
                // Render the Google button
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
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

    // Keep these handler functions from Stashed changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData.email, formData.password);
            
            // Save token
            utils.saveToken(response.token);
            
            // Get user profile
            const userProfile = await authAPI.getProfile(response.token);
            utils.saveUser(userProfile);
            
            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCredentialResponse = async (response) => {
        try {
            // Parse the JWT token to get user info
            const userInfo = parseJwt(response.credential);
            console.log('Google user info:', userInfo);
            
            if (userInfo) {
                // Send Google token to backend for verification and JWT generation
                const backendResponse = await fetch('http://localhost:8080/api/google-oauth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        google_token: response.credential,
                        role: 'student' // Default role, you can make this selectable
                    }),
                });

                const data = await backendResponse.json();

                if (backendResponse.ok) {
                    // Save the proper JWT token
                    utils.saveToken(data.token);
                    
                    // Fetch complete profile data using the token
                    try {
                        const profileResponse = await fetch('http://localhost:8080/api/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${data.token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        
                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            utils.saveUser(profileData);
                        } else {
                            // Fallback to basic user data if profile fetch fails
                            utils.saveUser(data.user);
                        }
                    } catch (profileError) {
                        console.warn('Failed to fetch complete profile, using basic data:', profileError);
                        utils.saveUser(data.user);
                    }
                    
                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    setError(data.error || 'Google authentication failed');
                }
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            setError('Google authentication failed: ' + error.message);
        }
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
    <div className="container">
      <div className="login-form">
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
        <h2>Login</h2>
        <form onSubmit={handleLoginSubmit}>
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
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="social-text">or signin with</p>
        <div className="social-icons">
          {/* This div is where the Google button will be rendered by the GIS library */}
          <div id="google-signin-button"></div>
          {/* You can uncomment or adjust these if you still plan to use other social icons */}
          {/* <i className="fab fa-facebook-f"></i> */}
          {/* <i className="fab fa-google-plus-g"></i> */}
          {/* <i className="fab fa-linkedin-in"></i> */}
        </div>
      </div>
      <div className="login-info">
        <h2>Welcome back!</h2>
        <p>
          Welcome back! We are so happy to have you here. It's great to see you again.
          
        </p>
        <button className="signup-btn" onClick={() => navigate('/signup')}>No account yet? Signup.</button>
      </div>
    </div>
  );
}

export default Login;