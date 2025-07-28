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
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			return
		}

		// Expecting header format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			return
		}

		tokenStr := parts[1]
		
		// Debug: Print token info (remove in production)
		fmt.Printf("DEBUG: Received token: %s...\n", tokenStr[:min(len(tokenStr), 20)])
		fmt.Printf("DEBUG: Current time: %v\n", time.Now().Unix())

		// Parse and verify token
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			// Ensure signing method is HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				fmt.Printf("DEBUG: Invalid signing method: %v\n", token.Method)
				return nil, jwt.ErrSignatureInvalid
			}
			return JWT_SECRET, nil
		})

		if err != nil {
			fmt.Printf("DEBUG: Token parse error: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}
		if !token.Valid {
			fmt.Printf("DEBUG: Token not valid\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			fmt.Printf("DEBUG: Token claims: %+v\n", claims)
			
			// Check expiration manually for debugging
			if exp, ok := claims["exp"].(float64); ok {
				fmt.Printf("DEBUG: Token expires at: %v (current: %v)\n", exp, time.Now().Unix())
				if int64(exp) < time.Now().Unix() {
					fmt.Printf("DEBUG: Token has expired!\n")
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
					return
				}
			}
			
			// Set userID and role to context
			c.Set("userID", uint(claims["user_id"].(float64)))
			c.Set("role", claims["role"].(string))
			c.Next()
		} else {
			fmt.Printf("DEBUG: Invalid token claims\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}
	}
}

func AuthorizeRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Role not found in token"})
			return
		}

		for _, r := range allowedRoles {
			if role == r {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
	}
}
