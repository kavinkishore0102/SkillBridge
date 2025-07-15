import './css/login.css';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function Login() {
    const navigate = useNavigate();
    
    useEffect(() => {
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
    }, []);

    const handleCredentialResponse = (response) => {
        // Parse the JWT token
        const userInfo = parseJwt(response.credential);
        console.log('Google user info:', userInfo);
        
        if (userInfo) {
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify({
                id: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            }));
            
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
  return (
    <div className="container">
      <div className="login-form">
        <h2>Login</h2>
        <form>
          <input type="text" placeholder="Username" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
        <p className="social-text">or signin with</p>
        <div className="social-icons">
          <div id="google-signin-button"></div>
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
