// Token validation utility
export const tokenUtils = {
  // Check if token is valid format (basic JWT validation)
  isValidTokenFormat: (token) => {
    if (!token || typeof token !== 'string') return false;
    
    // Check for fake tokens
    if (token === 'google-oauth-token') return false;
    
    // Basic JWT format validation (should have 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Try to parse the payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token has expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  },
  
  // Get token expiration time
  getTokenExpiration: (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp;
    } catch (error) {
      return null;
    }
  },
  
  // Check if token will expire soon (within 1 hour)
  willExpireSoon: (token) => {
    const exp = tokenUtils.getTokenExpiration(token);
    if (!exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60; // 1 hour in seconds
    
    return (exp - currentTime) < oneHour;
  }
};
