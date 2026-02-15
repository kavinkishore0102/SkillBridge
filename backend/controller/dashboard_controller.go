package controller

import (
	"SkillBridge/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

func StudentDashboard(c *gin.Context) {
	studentID := c.GetUint("userID")

	// --- Projects section: applications, accepted, rejected ---
	var projectApplications int64
	DB.Model(&models.Application{}).Where("student_id = ?", studentID).Count(&projectApplications)

	var projectAccepted int64
	DB.Model(&models.Application{}).Where("student_id = ? AND status = ?", studentID, "approved").Count(&projectAccepted)

	var projectRejected int64
	DB.Model(&models.Application{}).Where("student_id = ? AND status = ?", studentID, "rejected").Count(&projectRejected)

	// --- Jobs section: applications, accepted, rejected ---
	var jobApplications int64
	DB.Model(&models.JobApplication{}).Where("user_id = ?", studentID).Count(&jobApplications)

	var jobAccepted int64
	DB.Model(&models.JobApplication{}).Where("user_id = ? AND status = ?", studentID, "Accepted").Count(&jobAccepted)

	var jobRejected int64
	DB.Model(&models.JobApplication{}).Where("user_id = ? AND status = ?", studentID, "Rejected").Count(&jobRejected)

	c.JSON(http.StatusOK, gin.H{
		"projects": gin.H{
			"applications": projectApplications,
			"accepted":      projectAccepted,
			"rejected":      projectRejected,
		},
		"jobs": gin.H{
			"applications": jobApplications,
			"accepted":      jobAccepted,
			"rejected":      jobRejected,
		},
	})
}

func CompanyDashboard(c *gin.Context) {
	role := c.GetString("role")
	if role != "company" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	companyID := c.GetUint("userID")
	if companyID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid company ID"})
		return
	}

	// --- Projects section: posted, applications ---
	var postedProjects int64
	DB.Model(&models.Project{}).Where("company_id = ?", companyID).Count(&postedProjects)

	var projectApplications int64
	DB.Table("applications").
		Joins("JOIN projects ON applications.project_id = projects.id").
		Where("projects.company_id = ?", companyID).
		Count(&projectApplications)

	// --- Jobs section: posted, applications ---
	var postedJobs int64
	DB.Model(&models.JobListing{}).Where("company_id = ?", companyID).Count(&postedJobs)

	var jobApplications int64
	DB.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ?", companyID).
		Count(&jobApplications)

	c.JSON(http.StatusOK, gin.H{
		"projects": gin.H{
			"posted":       postedProjects,
			"applications": projectApplications,
		},
		"jobs": gin.H{
			"posted":       postedJobs,
			"applications": jobApplications,
		},
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
