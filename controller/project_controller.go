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
	userID, exits := c.Get("userID")
	if !exits {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User already exists"})
		return
	}

	var input struct {
		Name string `json:"name"`
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := DB.Model(&models.User{}).Where("id = ?", userID).
		Updates(models.User{Name: input.Name, Role: input.Role}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
