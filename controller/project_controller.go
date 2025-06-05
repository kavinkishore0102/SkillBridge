package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

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
