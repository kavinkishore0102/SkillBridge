package middleware

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"net/http"
	"strings"
	"time"
)

var JWT_SECRET = []byte("devsecret123")

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// To handle the JWT tokens
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return JWT_SECRET, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		c.Next()
	}
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the token from the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			fmt.Printf("DEBUG: Authorization header missing for path: %s\n", c.Request.URL.Path)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			return
		}

		// Expecting header format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			fmt.Printf("DEBUG: Invalid Authorization header format for path: %s, header: %s\n", c.Request.URL.Path, authHeader[:min(20, len(authHeader))])
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			return
		}

		tokenStr := parts[1]
		fmt.Printf("DEBUG: Parsing token for path: %s, token length: %d\n", c.Request.URL.Path, len(tokenStr))
		fmt.Printf("DEBUG: Token first 20 chars: %s\n", tokenStr[:min(20, len(tokenStr))])
		
		// Parse and verify token
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			// Ensure signing method is HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				fmt.Printf("DEBUG: Invalid signing method: %T\n", token.Method)
				return nil, jwt.ErrSignatureInvalid
			}
			fmt.Printf("DEBUG: Token method is valid HMAC\n")
			return JWT_SECRET, nil
		})

		if err != nil {
			fmt.Printf("DEBUG: Token parse error for path: %s, error: %v, type: %T\n", c.Request.URL.Path, err, err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "details": err.Error()})
			return
		}
		if !token.Valid {
			fmt.Printf("DEBUG: Token invalid for path: %s\n", c.Request.URL.Path)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			fmt.Printf("DEBUG: Token claims extracted successfully\n")
			fmt.Printf("DEBUG: Claims type: %T, Claims: %v\n", claims, claims)
			
			// Check expiration manually for debugging
			if exp, ok := claims["exp"].(float64); ok {
				fmt.Printf("DEBUG: Token exp: %v, now: %v\n", int64(exp), time.Now().Unix())
				if int64(exp) < time.Now().Unix() {
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
					return
				}
			}
			
			// Set userID and role to context
			userID, userIDOk := claims["user_id"].(float64)
			role, roleOk := claims["role"].(string)
			fmt.Printf("DEBUG: userID exists: %v (value: %v), role exists: %v (value: %s)\n", userIDOk, userID, roleOk, role)
			
			if !userIDOk || !roleOk {
				fmt.Printf("DEBUG: Missing user_id or role in claims\n")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
				return
			}
			
			c.Set("userID", uint(userID))
			c.Set("role", role)
			fmt.Printf("DEBUG: User context set. UserID: %d, Role: %s\n", uint(userID), role)
			c.Next()
		} else {
			fmt.Printf("DEBUG: Invalid token claims - type assertion failed or token not valid. ok: %v, token.Valid: %v\n", ok, token.Valid)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}
	}
}

func AuthorizeRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		fmt.Printf("DEBUG AuthorizeRoles: Path: %s, Role exists: %v, Role: %v, Allowed: %v\n", c.Request.URL.Path, exists, role, allowedRoles)
		
		if !exists {
			fmt.Printf("DEBUG AuthorizeRoles: Role not found in context\n")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Role not found in token"})
			return
		}

		for _, r := range allowedRoles {
			fmt.Printf("DEBUG AuthorizeRoles: Comparing %v (type %T) == %v (type %T)\n", role, role, r, r)
			if role == r {
				fmt.Printf("DEBUG AuthorizeRoles: Role match! Allowing access\n")
				c.Next()
				return
			}
		}

		fmt.Printf("DEBUG AuthorizeRoles: No role match. User role '%v' not in allowed roles %v\n", role, allowedRoles)
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
	}
}
