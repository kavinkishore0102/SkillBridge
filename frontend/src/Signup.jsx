import './css/signup.css';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
  
function Signup() {
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
        <h2>Signup</h2>
        <form>
          <input type="text" placeholder="Username" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <input type="password" placeholder="Confirm Password" />
          <button type="submit">Signup</button>
        </form>
        <p className="social-text">or signup with</p>
        <div className="social-icons">
          <div id="google-signup-button"></div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
