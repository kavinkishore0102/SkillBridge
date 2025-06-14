package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"log"
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

func GetAllProjects(c *gin.Context) {
	var projects []models.Project
	if err := DB.Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})

}

func ApplyToProject(c *gin.Context) {
	studentID := c.GetUint("userID")
	role := c.GetString("role")
	if role != "student" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		ProjectID uint `json:"project_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if project exists
	var project models.Project
	if err := DB.First(&project, input.ProjectID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	application := models.Application{
		ProjectID: input.ProjectID,
		StudentID: studentID,
	}

	if err := DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to apply to project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project applied successfully", "application": application})
}

func GetProjectApplicants(c *gin.Context) {
	projectID := c.Param("id")
	companyID := c.GetUint("userID")

	var project models.Project
	log.Printf("id = ? AND company_id = ?", projectID, companyID)
	if err := DB.Where("id = ? AND company_id = ?", projectID, companyID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or not owned by you"})
		return
	}

	var applications []models.Application
	if err := DB.Preload("Student").Where("project_id = ?", projectID).Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applicants"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applicants": applications})
}
