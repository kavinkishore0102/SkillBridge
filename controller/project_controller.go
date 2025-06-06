package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

func PostProject(c *gin.Context) {
	// Get company ID from context (set by middleware)
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.Project
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.CompanyID = companyID.(uint)
	if err := DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not post project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project posted successfully", "project": input})
}
