import './css/login.css';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
function Login() {
    const navigate = useNavigate();
=======
import { useEffect, useState } from 'react';
import { authAPI, utils } from './utils/api';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle traditional login form submission
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

    // Handle Google OAuth response
    const handleCredentialResponse = (response) => {
        // Parse the JWT token
        const userInfo = parseJwt(response.credential);
        console.log('Google user info:', userInfo);
        
        if (userInfo) {
            // Store user info in localStorage
            utils.saveUser({
                id: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                role: 'student' // Default role for Google OAuth users
            });
            
            // For now, we'll use a mock token for Google OAuth
            // In production, you'd send this to your backend to verify and get a proper JWT
            utils.saveToken('google-oauth-token');
            
            // Redirect to dashboard
            navigate('/dashboard');
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
>>>>>>> Stashed changes
  return (
    <div className="container">
      <div className="login-form">
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
          <i className="fab fa-facebook-f"></i>
          <i className="fab fa-google-plus-g"></i>
          <i className="fab fa-linkedin-in"></i>
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
