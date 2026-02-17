package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type JobListing struct {
	ID                  uint            `gorm:"primaryKey" json:"id"`
	CompanyID           uint            `json:"company_id"`
	Company             User            `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	Title               string          `json:"title"`
	Description         string          `gorm:"type:text" json:"description"`
	Category            string          `json:"category"` // Internship, Full-time, Part-time
	Domain              string          `json:"domain"`   // Engineering, Design, Marketing, etc.
	Location            string          `json:"location"`
	Stipend             int             `json:"stipend"`                         // In rupees, 0 for unpaid
	Currency            string          `gorm:"default:INR" json:"currency"`
	Experience          int             `json:"experience"`                      // Years required: 0, 1, 2
	Requirements        json.RawMessage `gorm:"type:json" json:"requirements"`   // JSON array
	Skills              json.RawMessage `gorm:"type:json" json:"skills"`         // JSON array
	ApplicantCount      int             `gorm:"default:0" json:"applicant_count"`
	ApplicationDeadline time.Time       `json:"application_deadline"`
	IsActive            bool            `gorm:"default:true" json:"is_active"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
	DeletedAt           gorm.DeletedAt  `gorm:"index" json:"-"`
}

type JobApplication struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	JobListingID uint          `json:"job_listing_id"`
	JobListing  JobListing     `gorm:"foreignKey:JobListingID" json:"job_listing,omitempty"`
	UserID      uint           `json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Status      string         `gorm:"default:Applied" json:"status"` // Applied, Shortlisted, Rejected, Accepted
	Resume      string         `json:"resume"`                         // URL to uploaded resume
	CoverLetter string         `gorm:"type:text" json:"cover_letter"`
	AppliedAt   time.Time      `json:"applied_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type UserSavedJob struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `json:"user_id"`
	JobListingID uint           `json:"job_listing_id"`
	JobListing   JobListing     `gorm:"foreignKey:JobListingID" json:"job_listing,omitempty"`
	SavedAt      time.Time      `json:"saved_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Request/Response DTOs
type CreateJobListingRequest struct {
	Title               string   `json:"title" binding:"required"`
	Description         string   `json:"description" binding:"required"`
	Category            string   `json:"category" binding:"required"`
	Domain              string   `json:"domain" binding:"required"`
	Location            string   `json:"location" binding:"required"`
	Stipend             int      `json:"stipend"`
	Currency            string   `json:"currency"`
	Experience          int      `json:"experience"` // 0, 1, or 2 years
	Duration            string   `json:"duration"`    // optional, deprecated - kept so older clients don't get 400
	Requirements        []string `json:"requirements"`
	Skills              []string `json:"skills"`
	ApplicationDeadline string   `json:"application_deadline" binding:"required"`
}

type UpdateJobListingRequest struct {
	Title               string   `json:"title"`
	Description         string   `json:"description"`
	Category            string   `json:"category"`
	Domain              string   `json:"domain"`
	Location            string   `json:"location"`
	Stipend             int      `json:"stipend"`
	Experience          int      `json:"experience"`
	Requirements        []string `json:"requirements"`
	Skills              []string `json:"skills"`
	ApplicationDeadline string   `json:"application_deadline"`
	IsActive            bool     `json:"is_active"`
}

type ApplyToJobRequest struct {
	CoverLetter string `json:"cover_letter"`
	Resume      string `json:"resume"`
}

type UpdateApplicationStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type JobApplicationResponse struct {
	ID          uint           `json:"id"`
	User        User           `json:"user"`
	Status      string         `json:"status"`
	Resume      string         `json:"resume"`
	CoverLetter string         `json:"cover_letter"`
	AppliedAt   time.Time      `json:"applied_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// Custom scan/value methods for JSON handling
func (r Requirements) Scan(value interface{}) error {
	bytes, _ := value.([]byte)
	return json.Unmarshal(bytes, &r)
}

func (r Requirements) Value() (driver.Value, error) {
	return json.Marshal(r)
}

type Requirements []string
type Skills []string
