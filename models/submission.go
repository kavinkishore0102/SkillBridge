package models

import (
	"gorm.io/gorm"
	"time"
)

type Submission struct {
	gorm.Model
	ProjectID   uint      `json:"project_id"`
	StudentID   uint      `json:"student_id"`
	GithubLink  string    `json:"github_link"`
	Notes       string    `json:"notes"`
	Status      string    `json:"status"`
	Feedback    string    `json:"feedback"`
	Student     User      `gorm:"foreignKey:StudentID"`
	SubmittedAt time.Time `json:"submitted_at"`
}
