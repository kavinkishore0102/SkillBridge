# Google OAuth Setup Instructions

## Steps to configure Google OAuth:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google Identity Services**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Identity Services" and enable it
   - Also enable "Google+ API" if needed

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add your domain to "Authorized JavaScript origins":
     - For development: `http://localhost:5173`
     - For development: `http://localhost:5174`
     - For development: `http://localhost:5175`
     - For production: your actual domain
   - Add redirect URIs:
     - For development: `http://localhost:5173/auth/google/callback`
     - For production: your actual callback URL

4. **Update the configuration**
   - Copy your Client ID from Google Cloud Console
   - The Client ID is already configured in the components:
     - Client ID: `694389954977-6m3ksdmkph01bmn98skfuac3mrvhaumu.apps.googleusercontent.com`

5. **Testing**
   - Run the application: `npm run dev` or `npx vite`
   - The frontend will be available at: `http://localhost:5178/` (or another port if 5178 is in use)
   - Click on "Continue with Google" button
   - The Google login popup should appear

## Current Status:
✅ **Fixed Issues:**
- Resolved Git merge conflicts in Login.jsx
- Removed problematic test-api.html files
- Frontend now runs successfully on port 5178
- All authentication flows working properly

## File Structure:
- `/src/utils/googleAuth.js` - Google OAuth utility functions
- `/src/utils/api.js` - API utilities for backend communication
- `/src/Login.jsx` - Login component with Google auth
- `/src/Signup.jsx` - Signup component with Google auth
- `/src/css/login.css` - Styling for login page
- `/src/css/signup.css` - Styling for signup page
- `/index.html` - Contains Google Identity Services script

## Features:
- ✅ Removed Facebook and LinkedIn login options
- ✅ Added Google OAuth integration with role selection
- ✅ Styled Google login button
- ✅ JWT token parsing
- ✅ User info storage in localStorage
- ✅ Backend API integration for user creation
- ✅ Role-based signup with dynamic fields
- ✅ Consistent styling across login and signup pages
- ✅ Error handling and validation
- ✅ Loading states

## Implementation Details:

### Login Flow:
1. User clicks "Continue with Google"
2. Google OAuth popup appears
3. User authenticates with Google
4. JWT token is parsed to get user info
5. User info is stored in localStorage
6. User is redirected to dashboard

### Signup Flow:
1. User clicks "Continue with Google" on signup page
2. Google OAuth popup appears
3. User authenticates with Google
4. Role selection modal appears
5. User selects role (Student/Company/Guide)
6. User data is sent to backend `/api/signup` endpoint
7. Backend creates user account with selected role
8. JWT token is returned and stored
9. User is redirected to dashboard

### Traditional Form Authentication:
- Both login and signup support traditional email/password forms
- Form validation and error handling
- Password confirmation for signup
- Role-specific fields in signup form (bio, GitHub, LinkedIn)

## Backend Integration:
- `/api/login` - User login endpoint
- `/api/signup` - User registration endpoint
- `/api/profile` - Get user profile endpoint
- JWT token authentication
- Password hashing with bcrypt
- MySQL database storage

## Role-Based Features:
- **Student**: Bio, GitHub URL, LinkedIn URL
- **Company**: Bio, LinkedIn URL
- **Guide**: Bio, GitHub URL, LinkedIn URL

## Notes:
- The Google auth integrates with backend for proper user management
- User information is stored both in localStorage and backend database
- The implementation includes comprehensive error handling
- Role selection ensures proper user categorization
- All authentication flows redirect to `/dashboard` after success
