package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"SkillBridge/models"
)

var db *gorm.DB

// Initialize DB connection
func InitJobDB(database *gorm.DB) {
	db = database
}

// CreateJobListing - Company posts a new job
func CreateJobListing(c *gin.Context) {
	fmt.Printf("DEBUG CreateJobListing: Starting\n")
	
	var req models.CreateJobListingRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Get company ID from JWT token
	companyID, exists := c.Get("userID")
	fmt.Printf("DEBUG CreateJobListing: Looking for 'userID', exists: %v, value: %v, type: %T\n", exists, companyID, companyID)
	
	if !exists {
		fmt.Printf("DEBUG CreateJobListing: userID not found in context\n")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Parse deadline
	deadline, err := time.Parse("2006-01-02", req.ApplicationDeadline)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid deadline format (use YYYY-MM-DD)"})
		return
	}

	// Convert arrays to JSON
	requirementsJSON, _ := json.Marshal(req.Requirements)
	skillsJSON, _ := json.Marshal(req.Skills)

	jobListing := models.JobListing{
		CompanyID:           companyID.(uint),
		Title:               req.Title,
		Description:         req.Description,
		Category:            req.Category,
		Domain:              req.Domain,
		Location:            req.Location,
		Stipend:             req.Stipend,
		Currency:            req.Currency,
		Experience:          req.Experience,
		Requirements:        json.RawMessage(requirementsJSON),
		Skills:              json.RawMessage(skillsJSON),
		ApplicationDeadline: deadline,
		IsActive:            true,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if result := db.Create(&jobListing); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job listing"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Job listing created successfully",
		"job":     jobListing,
	})
}

// GetCompanyJobListings - Get all jobs posted by a company
func GetCompanyJobListings(c *gin.Context) {
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var jobListings []models.JobListing
	if result := db.Where("company_id = ?", companyID).
		Order("created_at DESC").
		Find(&jobListings); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job listings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total": len(jobListings),
		"jobs":  jobListings,
	})
}

// GetJobListingByID - Get details of a specific job
func GetJobListingByID(c *gin.Context) {
	jobID := c.Param("id")
	
	var jobListing models.JobListing
	if result := db.Preload("Company").Where("id = ?", jobID).First(&jobListing); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job listing not found"})
		return
	}

	c.JSON(http.StatusOK, jobListing)
}

// UpdateJobListing - Update a job listing
func UpdateJobListing(c *gin.Context) {
	jobID := c.Param("id")
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var jobListing models.JobListing
	if result := db.Where("id = ? AND company_id = ?", jobID, companyID).First(&jobListing); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Job listing not found or unauthorized"})
		return
	}

	var req models.UpdateJobListingRequest
	if err := c.BindJSON(&req); err != nil {
		fmt.Printf("DEBUG UpdateJobListing: BindJSON error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	
	fmt.Printf("DEBUG UpdateJobListing: Received request: %+v\n", req)

	// Update fields if provided
	updates := map[string]interface{}{}
	
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Domain != "" {
		updates["domain"] = req.Domain
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.Stipend > 0 {
		updates["stipend"] = req.Stipend
	}
	updates["experience"] = req.Experience
	if len(req.Requirements) > 0 {
		reqJSON, _ := json.Marshal(req.Requirements)
		updates["requirements"] = json.RawMessage(reqJSON)
	}
	if len(req.Skills) > 0 {
		skillsJSON, _ := json.Marshal(req.Skills)
		updates["skills"] = json.RawMessage(skillsJSON)
	}
	if req.ApplicationDeadline != "" {
		deadline, _ := time.Parse("2006-01-02", req.ApplicationDeadline)
		updates["application_deadline"] = deadline
	}
	
	updates["is_active"] = req.IsActive
	updates["updated_at"] = time.Now()

	if result := db.Model(&jobListing).Updates(updates); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job listing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job listing updated successfully",
		"job":     jobListing,
	})
}

// DeleteJobListing - Soft delete a job listing
func DeleteJobListing(c *gin.Context) {
	jobID := c.Param("id")
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if result := db.Where("id = ? AND company_id = ?", jobID, companyID).Delete(&models.JobListing{}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job listing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job listing deleted successfully"})
}

// GetJobApplications - Get all applications for a job
func GetJobApplications(c *gin.Context) {
	jobID := c.Param("id")
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify company owns this job
	var jobListing models.JobListing
	if result := db.Where("id = ? AND company_id = ?", jobID, companyID).First(&jobListing); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	// Get status filter if provided
	status := c.Query("status")

	var applications []models.JobApplication
	query := db.Where("job_listing_id = ?", jobID).Preload("User")
	
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if result := query.Order("applied_at DESC").Find(&applications); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}

	// Format response
	applicants := make([]models.JobApplicationResponse, 0) // Initialize as empty array, not nil
	for _, app := range applications {
		applicants = append(applicants, models.JobApplicationResponse{
			ID:          app.ID,
			User:        app.User,
			Status:      app.Status,
			Resume:      app.Resume,
			CoverLetter: app.CoverLetter,
			AppliedAt:   app.AppliedAt,
			UpdatedAt:   app.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"job_id":     jobID,
		"total":      len(applicants),
		"applicants": applicants,
	})
}

// UpdateApplicationStatus - Update application status (Shortlist/Reject/Accept)
func UpdateApplicationStatus(c *gin.Context) {
	appID := c.Param("id")
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.UpdateApplicationStatusRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate status
	validStatuses := []string{"Applied", "Shortlisted", "Rejected", "Accepted"}
	isValid := false
	for _, valid := range validStatuses {
		if req.Status == valid {
			isValid = true
			break
		}
	}
	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be: Applied, Shortlisted, Rejected, or Accepted"})
		return
	}

	var application models.JobApplication
	if result := db.Preload("JobListing").Where("id = ?", appID).First(&application); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Verify company owns the job
	if application.JobListing.CompanyID != companyID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	// Update status
	if result := db.Model(&application).Update("status", req.Status).Update("updated_at", time.Now()); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application status"})
		return
	}

	// TODO: Send notification to user about status change

	c.JSON(http.StatusOK, gin.H{
		"message": "Application status updated successfully",
		"status":  req.Status,
	})
}

// GetApplicationStats - Get stats for company's job postings
func GetApplicationStats(c *gin.Context) {
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	jobID := c.Query("job_id")

	type Stats struct {
		TotalApplications int `json:"totalApplications"`
		ShortlistedCount  int `json:"shortlistedCount"`
		RejectedCount     int `json:"rejectedCount"`
		AcceptedCount     int `json:"acceptedCount"`
		PendingCount      int `json:"pendingCount"`
	}

	var stats Stats
	var totalCount int64
	var shortlistCount int64
	var rejectCount int64
	var acceptCount int64
	var pendingCount int64

	query := db.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ?", companyID)

	if jobID != "" {
		query = query.Where("job_listings.id = ?", jobID)
	}

	query.Count(&totalCount)
	db.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ? AND job_applications.status = ?", companyID, "Shortlisted").
		Count(&shortlistCount)
	db.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ? AND job_applications.status = ?", companyID, "Rejected").
		Count(&rejectCount)
	db.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ? AND job_applications.status = ?", companyID, "Accepted").
		Count(&acceptCount)
	db.Table("job_applications").
		Joins("JOIN job_listings ON job_applications.job_listing_id = job_listings.id").
		Where("job_listings.company_id = ? AND job_applications.status = ?", companyID, "Applied").
		Count(&pendingCount)

	stats.TotalApplications = int(totalCount)
	stats.ShortlistedCount = int(shortlistCount)
	stats.RejectedCount = int(rejectCount)
	stats.AcceptedCount = int(acceptCount)
	stats.PendingCount = int(pendingCount)

	c.JSON(http.StatusOK, stats)
}

// GetApplicationDetail - Get detailed view of a specific application
func GetApplicationDetail(c *gin.Context) {
	appID := c.Param("id")
	companyID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var application models.JobApplication
	if result := db.Preload("User").Preload("JobListing").Where("id = ?", appID).First(&application); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	// Verify company owns the job
	if application.JobListing.CompanyID != companyID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, application)
}

// ApplyToJob - Student applies to a job listing
func ApplyToJob(c *gin.Context) {
	jobIDStr := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID := userID.(uint)

	var req models.ApplyToJobRequest
	c.BindJSON(&req) // optional body

	var job models.JobListing
	if result := db.Where("id = ? AND is_active = ?", jobIDStr, true).First(&job); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found or no longer active"})
		return
	}
	if job.ApplicationDeadline.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application deadline has passed"})
		return
	}

	var existing models.JobApplication
	if result := db.Where("job_listing_id = ? AND user_id = ?", job.ID, studentID).First(&existing); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already applied to this job"})
		return
	}

	application := models.JobApplication{
		JobListingID: job.ID,
		UserID:       studentID,
		Status:       "Applied",
		CoverLetter:  req.CoverLetter,
		Resume:       req.Resume,
		AppliedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if result := db.Create(&application); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit application"})
		return
	}

	// Increment applicant count on job listing
	db.Model(&models.JobListing{}).Where("id = ?", job.ID).Update("applicant_count", gorm.Expr("applicant_count + ?", 1))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Application submitted successfully",
		"application_id": application.ID,
	})
}

// GetMyJobApplications - Get job IDs the student has applied to
func GetMyJobApplications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var applications []models.JobApplication
	if result := db.Where("user_id = ?", userID.(uint)).Find(&applications); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}
	jobIDs := make([]uint, 0, len(applications))
	for _, app := range applications {
		jobIDs = append(jobIDs, app.JobListingID)
	}
	c.JSON(http.StatusOK, gin.H{"job_ids": jobIDs})
}

// GetAllJobListings - Get all job listings (public endpoint with filtering)
func GetAllJobListings(c *gin.Context) {
	domain := c.Query("domain")
	location := c.Query("location")
	category := c.Query("category")

	var jobListings []models.JobListing
	query := db.Where("is_active = ?", true)

	if domain != "" {
		query = query.Where("domain = ?", domain)
	}
	if location != "" {
		query = query.Where("location LIKE ?", "%"+location+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}

	if result := query.Preload("Company").Order("created_at DESC").Find(&jobListings); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job listings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total": len(jobListings),
		"jobs":  jobListings,
	})
}
