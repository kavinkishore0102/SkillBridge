package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

func GetAllGuides(c *gin.Context) {
	var guides []models.User
	
	// Get all users with role "guide"
	if err := DB.Where("role = ?", "guide").Find(&guides).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch guides"})
		return
	}

	// Return only public fields for guides
	var publicGuides []gin.H
	for _, guide := range guides {
		publicGuides = append(publicGuides, gin.H{
			"id":           guide.ID,
			"name":         guide.Name,
			"bio":          guide.Bio,
			"picture":      guide.Picture,
			"github_url":   guide.GithubURL,
			"linkedin":     guide.LinkedIn,
			"university":   guide.University,
			"major":        guide.Major,
			"year":         guide.Year,
			"position":     guide.Position,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"guides": publicGuides,
		"count":  len(publicGuides),
	})
}

func GetPublicStudentProfile(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found!"})
		return
	}

	if user.Role != "student" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not Student!"})
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
