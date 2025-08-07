package models

import (
	"gorm.io/gorm"
	"time"
)

type Submission struct {
	gorm.Model
	ProjectID     uint      `json:"project_id"`
	StudentID     uint      `json:"student_id"`
	GithubLink    string    `json:"github_link"`
	GithubURL     string    `json:"github_url"`
	Notes         string    `json:"notes"`
	Status        string    `json:"status"`
	Feedback      string    `json:"feedback"`
	ReviewStatus  string    `json:"review_status"`  // Guide review: approved, rejected, pending
	ReviewComment string    `json:"review_comment"` // Guide review comment
	Student       User      `gorm:"foreignKey:StudentID"`
	Project       Project   `gorm:"foreignKey:ProjectID"`
	SubmittedAt   time.Time `json:"submitted_at"`
}
