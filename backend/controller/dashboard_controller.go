package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

func StudentDashboard(c *gin.Context) {
	studentID := c.GetUint("userID")

	var appliedCount int64
	var submissionCount int64
	var acceptedCount, rejectedCount, pendingCount int64

	// Count applications
	if err := DB.Model(&models.Application{}).Where("student_id = ?", studentID).Count(&appliedCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications count"})
		return
	}

	// Count submissions
	if err := DB.Model(&models.Submission{}).Where("student_id = ?", studentID).Count(&submissionCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions count"})
		return
	}

	// Count submissions by status
	DB.Model(&models.Submission{}).Where("student_id = ? AND status = ?", studentID, "accepted").Count(&acceptedCount)
	DB.Model(&models.Submission{}).Where("student_id = ? AND status = ?", studentID, "rejected").Count(&rejectedCount)
	DB.Model(&models.Submission{}).Where("student_id = ? AND status = ?", studentID, "pending").Count(&pendingCount)

	c.JSON(http.StatusOK, gin.H{
		"applied_projects": appliedCount,
		"submissions":      submissionCount,
		"submission_summary": gin.H{
			"accepted": acceptedCount,
			"rejected": rejectedCount,
			"pending":  pendingCount,
		},
	})
}

func CompanyDashboard(c *gin.Context) {
	// Ensure only company users access this endpoint
	role := c.GetString("role")
	if role != "company" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get logged-in company ID from JWT middleware
	companyID := c.GetUint("userID")
	if companyID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	// Declare stats variables
	var postedProjects int64
	var totalApplicants int64
	var totalSubmissions int64

	// Count posted projects by this company
	if err := DB.
		Model(&models.Project{}).
		Where("company_id = ?", companyID).
		Count(&postedProjects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count posted projects"})
		return
	}

	// Count total applicants who applied to this company's projects
	if err := DB.
		Table("applications").
		Joins("JOIN projects ON applications.project_id = projects.id").
		Where("projects.company_id = ?", companyID).
		Count(&totalApplicants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count applicants"})
		return
	}

	// Count submissions related to this company's projects
	if err := DB.
		Table("submissions").
		Joins("JOIN projects ON submissions.project_id = projects.id").
		Where("projects.company_id = ?", companyID).
		Count(&totalSubmissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count submissions"})
		return
	}

	// Return the dashboard stats
	c.JSON(http.StatusOK, gin.H{
		"posted_projects":   postedProjects,
		"total_applicants":  totalApplicants,
		"total_submissions": totalSubmissions,
	})
}

func GuideDashboard(c *gin.Context) {
	// Ensure only guide users access this endpoint
	role := c.GetString("role")
	if role != "guide" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get logged-in guide ID from JWT middleware
	guideID := c.GetUint("userID")
	if guideID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid guide ID"})
		return
	}

	// Declare stats variables
	var assignedStudents int64
	var totalSubmissions int64
	var pendingReviews int64
	var completedReviews int64

	// Count accepted connection requests from students
	if err := DB.
		Model(&models.GuideConnectionRequest{}).
		Where("guide_id = ? AND status = ?", guideID, "accepted").
		Count(&assignedStudents).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count assigned students"})
		return
	}

	// Count pending connection requests (waiting for guide approval)
	if err := DB.
		Model(&models.GuideConnectionRequest{}).
		Where("guide_id = ? AND status = ?", guideID, "pending").
		Count(&pendingReviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count pending reviews"})
		return
	}

	// Count total submissions for students assigned to this guide
	if err := DB.
		Table("submissions").
		Joins("JOIN guide_connection_requests ON submissions.student_id IN (SELECT student_id FROM guide_connection_requests WHERE guide_id = ? AND status = 'accepted')", guideID).
		Count(&totalSubmissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count submissions"})
		return
	}

	// Count completed reviews (accepted connection requests)
	if err := DB.
		Model(&models.GuideConnectionRequest{}).
		Where("guide_id = ? AND status = ?", guideID, "accepted").
		Count(&completedReviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count completed reviews"})
		return
	}

	// Return the dashboard stats
	c.JSON(http.StatusOK, gin.H{
		"assigned_projects":  assignedStudents,
		"total_submissions":  totalSubmissions,
		"pending_reviews":    pendingReviews,
		"completed_reviews":  completedReviews,
	})
}

func AdminDashboard(c *gin.Context) {
	var studentCount, companyCount, projectCount int64

	DB.Model(&models.User{}).Where("role = ?", "student").Count(&studentCount)
	DB.Model(&models.User{}).Where("role = ?", "company").Count(&companyCount)
	DB.Model(&models.Project{}).Count(&projectCount)

	c.JSON(http.StatusOK, gin.H{
		"total_students":  studentCount,
		"total_companies": companyCount,
		"total_projects":  projectCount,
	})
}
