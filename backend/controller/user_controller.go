package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

func GetPublicStudentProfile(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Student not found!"})
		return
	}

	if user.Role != "student" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "User is not Student!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           userID,
		"name":         user.Name,
		"email":        user.Email,
		"bio":          user.Bio,
		"github_url":   user.GithubURL,
		"linkedIn_url": user.LinkedIn,
	})
}

func GetPublicCompanyProfile(c *gin.Context) {
	companyID := c.Param("id")

	var company models.User
	if err := DB.Where("id = ? AND role = ?", companyID, "company").First(&company).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	// Return only public fields
	c.JSON(http.StatusOK, gin.H{
		"id":    company.ID,
		"name":  company.Name,
		"email": company.Email,
		"bio":   company.Bio,
	})
}
