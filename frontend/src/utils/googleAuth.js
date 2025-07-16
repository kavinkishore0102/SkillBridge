// Google OAuth configuration
const GOOGLE_CLIENT_ID = '694389954977-6m3ksdmkph01bmn98skfuac3mrvhaumu.apps.googleusercontent.com'; // Your actual Google Client ID
const REDIRECT_URI = 'http://localhost:5176/auth/google/callback'; // Adjust for your app

// Initialize Google OAuth
export const initGoogleAuth = () => {
    return new Promise((resolve, reject) => {
        console.log('Initializing Google Auth...');
        
        // Check if Google script is loaded
        if (typeof window !== 'undefined' && window.google && window.google.accounts) {
            console.log('Google script already loaded, initializing...');
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                console.log('Google Auth initialized successfully');
                resolve();
            } catch (error) {
                console.error('Error initializing Google Auth:', error);
                reject(error);
            }
        } else {
            console.log('Google script not loaded, loading script...');
            // Load Google Identity Services script
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                console.log('Google script loaded successfully');
                try {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });
                    console.log('Google Auth initialized after script load');
                    resolve();
                } catch (error) {
                    console.error('Error initializing Google Auth after script load:', error);
                    reject(error);
                }
            };
            script.onerror = (error) => {
                console.error('Error loading Google script:', error);
                reject(error);
            };
            document.head.appendChild(script);
        }
    });
};

// Handle the credential response from Google
const handleCredentialResponse = (response) => {
    // Decode the JWT token to get user info
    const userInfo = parseJwt(response.credential);
    console.log('Google user info:', userInfo);
    
    // Here you would typically:
    // 1. Send the token to your backend for verification
    // 2. Create/login the user in your system
    // 3. Set up the user session
    
    // For now, we'll just log the user info
    handleGoogleAuthSuccess(userInfo);
};

// Parse JWT token
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

// Handle successful Google authentication
const handleGoogleAuthSuccess = (userInfo) => {
    if (userInfo) {
        // Store user info in localStorage or state management
        localStorage.setItem('user', JSON.stringify({
            id: userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        }));
        
        // Redirect to dashboard or home page
        window.location.href = '/dashboard';
    }
};

// Trigger Google login
export const signInWithGoogle = () => {
    console.log('Google Sign-In button clicked');
    
    initGoogleAuth().then(() => {
        console.log('Google Auth initialized successfully');
        
        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                // Simply show the One Tap prompt without callback complications
                window.google.accounts.id.prompt();
            } catch (error) {
                console.error('Error showing Google prompt:', error);
                alert('Failed to show Google authentication. Please try again.');
            }
        } else {
            console.error('Google accounts object not available');
            alert('Google authentication service is not available. Please check your internet connection and try again.');
        }
    }).catch(error => {
        console.error('Error initializing Google Auth:', error);
        alert('Failed to initialize Google authentication. Please try again.');
    });
};

// Trigger Google signup (same as login for Google OAuth)
export const signUpWithGoogle = () => {
    signInWithGoogle();
};

// Sign out
export const signOutGoogle = () => {
    if (window.google) {
        window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('user');
    window.location.href = '/';
};
