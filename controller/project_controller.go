package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strconv"
	"time"
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

func SubmitProject(c *gin.Context) {
	studentID := c.GetUint("userID")
	role := c.GetString("role")

	if role != "student" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	projectIDParam := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var input struct {
		GitHubLink string `json:"github_link"`
		Notes      string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Optional: Check if the student already submitted
	var existing models.Submission
	if err := DB.Where("student_id = ? AND project_id = ?", studentID, projectID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already submitted"})
		return
	}

	submission := models.Submission{
		ProjectID:   uint(projectID),
		StudentID:   studentID,
		GithubLink:  input.GitHubLink,
		Notes:       input.Notes,
		SubmittedAt: time.Now(),
	}

	if err := DB.Create(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Submission failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project submitted successfully", "submission": submission})
}

func GetProjectSubmissions(c *gin.Context) {
	projectIDParam := c.Param("id")
	companyID := c.GetUint("userID")

	var project models.Project
	if err := DB.Where("id = ? AND company_id = ?", projectIDParam, companyID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or unauthorized"})
		return
	}

	var submissions []models.Submission
	if err := DB.Preload("Student").Where("project_id = ?", projectIDParam).Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

func ReviewSubmission(c *gin.Context) {
	submissionIDParam := c.Param("id")
	submissionID, err := strconv.ParseUint(submissionIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission ID"})
		return
	}

	role := c.GetString("role")
	if role != "company" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		Status   string `json:"status"`   // accepted, rejected, changes_requested
		Feedback string `json:"feedback"` // optional
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Optional: Validate status input
	validStatuses := map[string]bool{
		"accepted":          true,
		"rejected":          true,
		"changes_requested": true,
	}
	if !validStatuses[input.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status value"})
		return
	}

	// Find the submission
	var submission models.Submission
	if err := DB.First(&submission, submissionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	// Update the fields
	submission.Status = input.Status
	submission.Feedback = input.Feedback

	if err := DB.Save(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update submission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submission reviewed", "submission": submission})
}
