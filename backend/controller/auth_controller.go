package controller

import (
	"SkillBridge/middleware"
	"SkillBridge/models"
	"SkillBridge/utils"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitAuth(db *gorm.DB) {
	DB = db
}

func SignUp(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check existing user
	var existUser models.User
	if err := DB.Where("email = ?", user.Email).First(&existUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password (REMOVED LOGGING)
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}
	user.Password = hashedPassword

	// Create user
	if err := DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	// Generate token with role claim (FIXED)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,                                 // ADDED ROLE
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	// Use consistent secret (FIXED)
	tokenString, err := token.SignedString(middleware.JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User created successfully",
		"token":   tokenString,
	})
}

func Login(c *gin.Context) {
	var credentials struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credentials"})
		return
	}

	var user models.User
	// Generic error for security (FIXED)
	errMsg := "Incorrect email or password"

	if err := DB.Where("email = ?", credentials.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": errMsg}) // Changed to 401
		return
	}

	if !utils.CheckPassword(user.Password, credentials.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": errMsg}) // Consistent error
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days instead of 12 hours
	})

	tokenStr, err := token.SignedString(middleware.JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenStr})
}

func GetProfile(c *gin.Context) {
	userID, exits := c.Get("userID")
	if !exits {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User already exists"})
		return
	}

	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// successfully profile got.
	c.JSON(http.StatusOK, gin.H{
		"id":            user.ID,
		"name":          user.Name,
		"email":         user.Email,
		"role":          user.Role,
		"picture":       user.Picture,
		"bio":           user.Bio,
		"github_url":    user.GithubURL,
		"linkedin":      user.LinkedIn,
		"phone":         user.Phone,
		"university":    user.University,
		"major":         user.Major,
		"year":          user.Year,
		"company_name":  user.CompanyName,
		"position":      user.Position,
		"portfolio_url": user.PortfolioURL,
		"skills":        user.Skills,
	})
}

func UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var input struct {
		Name         string `json:"name"`
		Email        string `json:"email"`
		Role         string `json:"role"`
		Bio          string `json:"bio"`
		GithubURL    string `json:"github_url"`
		LinkedIn     string `json:"linkedin"`
		Phone        string `json:"phone"`
		University   string `json:"university"`
		Major        string `json:"major"`
		Year         string `json:"year"`
		CompanyName  string `json:"company_name"`
		Position     string `json:"position"`
		PortfolioURL string `json:"portfolio_url"`
		Skills       string `json:"skills"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Check if the new email already exists for another user (only if email is being changed)
	var existing models.User
	if err := DB.Where("email = ? AND id != ?", input.Email, userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is already in use"})
		return
	}

	// Update user profile
	updateData := models.User{
		Name:         input.Name,
		Email:        input.Email,
		Role:         input.Role,
		Bio:          input.Bio,
		GithubURL:    input.GithubURL,
		LinkedIn:     input.LinkedIn,
		Phone:        input.Phone,
		University:   input.University,
		Major:        input.Major,
		Year:         input.Year,
		CompanyName:  input.CompanyName,
		Position:     input.Position,
		PortfolioURL: input.PortfolioURL,
		Skills:       input.Skills,
	}

	if err := DB.Model(&models.User{}).Where("id = ?", userID).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	// Get updated user data
	var updatedUser models.User
	if err := DB.First(&updatedUser, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated profile"})
		return
	}

	// Return success with updated profile data
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":            updatedUser.ID,
			"name":          updatedUser.Name,
			"email":         updatedUser.Email,
			"role":          updatedUser.Role,
			"picture":       updatedUser.Picture,
			"bio":           updatedUser.Bio,
			"github_url":    updatedUser.GithubURL,
			"linkedin":      updatedUser.LinkedIn,
			"phone":         updatedUser.Phone,
			"university":    updatedUser.University,
			"major":         updatedUser.Major,
			"year":          updatedUser.Year,
			"company_name":  updatedUser.CompanyName,
			"position":      updatedUser.Position,
			"portfolio_url": updatedUser.PortfolioURL,
			"skills":        updatedUser.Skills,
		},
	})
}

// SetGithubToken allows users to securely set their GitHub token for repository creation
func SetGithubToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var input struct {
		GithubToken string `json:"github_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Validate GitHub token by making a test API call
	githubService := utils.NewGitHubService(input.GithubToken)
	userInfo, err := githubService.GetUserInfo()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid GitHub token or insufficient permissions"})
		return
	}

	// Update user's GitHub token
	if err := DB.Model(&models.User{}).Where("id = ?", userID).Update("github_token", input.GithubToken).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save GitHub token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "GitHub token saved successfully",
		"github_user":      userInfo["login"], // Return GitHub username for confirmation
		"can_create_repos": true,
	})
}

// RemoveGithubToken allows users to remove their GitHub token
func RemoveGithubToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	// Remove GitHub token
	if err := DB.Model(&models.User{}).Where("id = ?", userID).Update("github_token", "").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove GitHub token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "GitHub token removed successfully",
		"can_create_repos": false,
	})
}

// GoogleOAuth handles Google OAuth authentication
func GoogleOAuth(c *gin.Context) {
	var input struct {
		GoogleToken string `json:"google_token" binding:"required"`
		Role        string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Parse the Google JWT token to extract user info
	userInfo, err := parseGoogleJWT(input.GoogleToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Google token"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := DB.Where("email = ?", userInfo.Email).First(&existingUser).Error; err == nil {
		// User exists, update picture if it's different and generate JWT and login
		if existingUser.Picture != userInfo.Picture {
			existingUser.Picture = userInfo.Picture
			DB.Save(&existingUser)
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": existingUser.ID,
			"role":    existingUser.Role,
			"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		})

		tokenString, err := token.SignedString(middleware.JWT_SECRET)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Login successful",
			"token":   tokenString,
			"user": gin.H{
				"id":      existingUser.ID,
				"name":    existingUser.Name,
				"email":   existingUser.Email,
				"role":    existingUser.Role,
				"picture": existingUser.Picture,
			},
		})
		return
	}

	// User doesn't exist, create new user
	if input.Role == "" {
		input.Role = "student" // Default role
	}

	// Generate a random password for Google OAuth users
	randomPassword := generateRandomPassword()
	hashedPassword, err := utils.HashPassword(randomPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	newUser := models.User{
		Name:     userInfo.Name,
		Email:    userInfo.Email,
		Password: hashedPassword,
		Role:     input.Role,
		Picture:  userInfo.Picture,
	}

	if err := DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	// Generate JWT token for new user
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": newUser.ID,
		"role":    newUser.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	tokenString, err := token.SignedString(middleware.JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User created successfully",
		"token":   tokenString,
		"user": gin.H{
			"id":      newUser.ID,
			"name":    newUser.Name,
			"email":   newUser.Email,
			"role":    newUser.Role,
			"picture": newUser.Picture,
		},
	})
}

// Helper functions for Google OAuth
type GoogleUserInfo struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	Sub     string `json:"sub"`
}

func parseGoogleJWT(tokenString string) (*GoogleUserInfo, error) {
	// Parse without verification for user info extraction
	// In production, you should verify the token with Google's public keys
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		email, _ := claims["email"].(string)
		name, _ := claims["name"].(string)
		picture, _ := claims["picture"].(string)
		sub, _ := claims["sub"].(string)

		userInfo := &GoogleUserInfo{
			Email:   email,
			Name:    name,
			Picture: picture,
			Sub:     sub,
		}
		return userInfo, nil
	}

	return nil, jwt.ErrInvalidKey
}

func generateRandomPassword() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}

// RefreshToken generates a new token for the user
func RefreshToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	role, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	// Generate new token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	tokenString, err := token.SignedString(middleware.JWT_SECRET)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"token":   tokenString,
	})
}
