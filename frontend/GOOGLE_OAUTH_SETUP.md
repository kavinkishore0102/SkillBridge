# Google OAuth Setup Instructions

## Steps to configure Google OAuth:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add your domain to "Authorized JavaScript origins":
     - For development: `http://localhost:5173`
     - For production: your actual domain
   - Add redirect URIs:
     - For development: `http://localhost:5173/auth/google/callback`
     - For production: your actual callback URL

4. **Update the configuration**
   - Copy your Client ID from Google Cloud Console
   - Replace `YOUR_GOOGLE_CLIENT_ID` in `/src/utils/googleAuth.js` with your actual Client ID

5. **Testing**
   - Run the application: `npm run dev`
   - Click on "Continue with Google" button
   - The Google login popup should appear

## File Structure:
- `/src/utils/googleAuth.js` - Google OAuth utility functions
- `/src/Login.jsx` - Login component with Google auth
- `/src/Signup.jsx` - Signup component with Google auth
- `/src/css/login.css` - Styling for login page
- `/src/css/signup.css` - Styling for signup page

## Features:
- ✅ Removed Facebook and LinkedIn login options
- ✅ Added Google OAuth integration
- ✅ Styled Google login button
- ✅ JWT token parsing
- ✅ User info storage in localStorage
- ✅ Consistent styling across login and signup pages

## Notes:
- The Google auth will redirect to `/dashboard` after successful login
- User information is stored in localStorage
- The implementation includes error handling and proper JWT parsing
