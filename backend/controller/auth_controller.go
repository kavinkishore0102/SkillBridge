package controller

import (
	"SkillBridge/middleware"
	"SkillBridge/models"
	"SkillBridge/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"gorm.io/gorm"
	"net/http"
	"time"
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
		"role":    user.Role, // ADDED ROLE
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
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
		"exp":     time.Now().Add(time.Hour * 12).Unix(),
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
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
		"role":  user.Role,
	})
}

func UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	var input struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if the new email already exists for another user
	var existing models.User
	if err := DB.Where("email = ? AND id != ?", input.Email, userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is already in use"})
		return
	}

	if err := DB.Model(&models.User{}).Where("id = ?", userID).
		Updates(models.User{Name: input.Name, Email: input.Email, Role: input.Role}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
