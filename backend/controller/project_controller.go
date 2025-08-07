package controller

import (
	"SkillBridge/models"
	"SkillBridge/utils"
	"fmt"
	"io"
	"strings"
	"time"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
	"net/http"
	"strconv"
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
		log.Printf("PostProject - JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid JSON data: %v", err)})
		return
	}

	input.CompanyID = companyID.(uint)
	if err := DB.Create(&input).Error; err != nil {
		log.Printf("PostProject - Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not post project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project posted successfully", "project": input})
}

// SubmitGithubRepo allows students to submit their GitHub repository URL for an application
func SubmitGithubRepo(c *gin.Context) {
	fmt.Println("=== SubmitGithubRepo called ===")
	
	studentID := c.GetUint("userID")
	role := c.GetString("role")
	if role != "student" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input struct {
		ApplicationID uint   `json:"application_id" binding:"required"`
		GithubRepoURL string `json:"github_repo_url" binding:"required"`
	}

	// Print raw request body for debugging
	body, _ := c.GetRawData()
	fmt.Printf("Raw request body: %s\n", string(body))
	
	// Reset the body so it can be read again by ShouldBindJSON
	c.Request.Body = io.NopCloser(strings.NewReader(string(body)))

	fmt.Printf("Attempting to bind JSON to struct: %+v\n", input)
	
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Printf("JSON binding error: %v\n", err)
		
		// Provide more specific error messages
		if strings.Contains(err.Error(), "application_id") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Missing or invalid application_id. Please ensure you have selected a valid application.",
				"details": err.Error(),
			})
		} else if strings.Contains(err.Error(), "github_repo_url") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Missing or invalid github_repo_url. Please provide a valid GitHub repository URL.",
				"details": err.Error(),
			})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request format. Please check your input.",
				"details": err.Error(),
			})
		}
		return
	}

	fmt.Printf("Successfully bound request: %+v\n", input)

	// Validate that application_id is not zero
	if input.ApplicationID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application_id: cannot be zero"})
		return
	}

	// Validate GitHub URL format
	if !strings.Contains(input.GithubRepoURL, "github.com") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid GitHub repository URL"})
		return
	}

	// Find the application and verify ownership
	var application models.Application
	if err := DB.Where("id = ? AND student_id = ?", input.ApplicationID, studentID).First(&application).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found or not owned by you"})
		return
	}

	// Update the application with GitHub repository URL
	if err := DB.Model(&application).Update("github_repo_url", input.GithubRepoURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit GitHub repository"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "GitHub repository submitted successfully",
		"application_id": application.ID,
		"github_repo_url": input.GithubRepoURL,
	})
}

func GetAllProjects(c *gin.Context) {
	var projects []models.Project
	if err := DB.Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "project not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func GetProjectById(c *gin.Context) {
	projectID := c.Param("id")
	
	var project models.Project
	if err := DB.First(&project, projectID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch project"})
		}
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": project})
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

	// Check if already applied
	var existingApplication models.Application
	if err := DB.Where("project_id = ? AND student_id = ?", input.ProjectID, studentID).First(&existingApplication).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already applied to this project"})
		return
	}

	application := models.Application{
		ProjectID:     input.ProjectID,
		StudentID:     studentID,
		Status:        "pending", // Set default status
		ProjectTitle:  project.Title, // Save project title directly
		GithubRepoURL: "", // Empty initially, can be submitted later
	}

	if err := DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to apply to project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project applied successfully",
		"application": application,
	})
}

// Helper function to extract GitHub username from URL
func extractGithubUsername(githubURL string) string {
	if githubURL == "" {
		return ""
	}
	
	// Handle different GitHub URL formats
	// https://github.com/username
	// https://www.github.com/username
	// github.com/username
	
	parts := strings.Split(githubURL, "/")
	if len(parts) >= 2 {
		// Get the last non-empty part
		for i := len(parts) - 1; i >= 0; i-- {
			if parts[i] != "" && parts[i] != "github.com" && parts[i] != "www.github.com" && !strings.HasPrefix(parts[i], "http") {
				return parts[i]
			}
		}
	}
	
	return ""
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

	var submission models.Submission
	if err := DB.First(&submission, submissionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Submission not found"})
		return
	}

	// Update submission fields
	submission.Status = input.Status
	submission.Feedback = input.Feedback

	if err := DB.Save(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update submission"})
		return
	}

	// 🔔 Send notification to the student
	err = utils.CreateNotification(DB, submission.StudentID, "Your submission was reviewed: "+input.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Submission reviewed",
		"submission": submission,
	})
}

func GetMySubmissions(c *gin.Context) {
	studentID := c.GetUint("userID")

	var submissions []models.Submission
	if err := DB.Preload("Project", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "title")
	}).Where("student_id = ?", studentID).Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

func GetCompanyApplications(c *gin.Context) {
	companyID := c.GetUint("userID")

	var applications []models.Application

	err := DB.Preload("Student").
		Preload("Project").
		Joins("JOIN projects ON projects.id = applications.project_id").
		Where("projects.company_id = ?", companyID).
		Find(&applications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

func GetCompanyProjects(c *gin.Context) {
	companyID := c.GetUint("userID")

	var projects []models.Project
	if err := DB.Where("company_id = ?", companyID).Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func GetMyApplications(c *gin.Context) {
	studentID := c.GetUint("userID")

	var applications []models.Application
	if err := DB.Preload("Project").Where("student_id = ?", studentID).Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"applications": applications})
}

func GetGuideSubmissions(c *gin.Context) {
	guideID := c.GetUint("userID")

	var submissions []models.Submission
	err := DB.Preload("Student").
		Joins("JOIN projects ON submissions.project_id = projects.id").
		Where("projects.guide_id = ?", guideID).
		Find(&submissions).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions for guide"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

// controller/project_controller.go
func DeleteProject(c *gin.Context) {
	projectID := c.Param("id")
	companyID := c.GetUint("userID") // from JWT
	role := c.GetString("role")

	if role != "company" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var project models.Project
	if err := DB.Where("id = ? AND company_id = ?", projectID, companyID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or unauthorized"})
		return
	}

	if err := DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

func WithdrawApplication(c *gin.Context) {
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

	// Find the application
	var application models.Application
	if err := DB.Where("student_id = ? AND project_id = ?", studentID, projectID).First(&application).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Delete the application
	if err := DB.Delete(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to withdraw application"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application withdrawn successfully"})
}
