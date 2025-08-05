package models

import (
	"gorm.io/gorm"
	"time"
)

type Project struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Requirements string    `json:"requirements"`
	Skills       string    `json:"skills"`
	Budget       string    `json:"budget"`
	CompanyID    uint      `json:"company_id"`
	GuideID      *uint     `json:"guide_id,omitempty"` // Optional guide assignment
	Deadline     time.Time `json:"deadline"`
	Difficulty   string    `json:"difficulty"`   // beginner, intermediate, advanced
	Duration     string    `json:"duration"`     // project duration
	TeamSize     string    `json:"team_size"`    // number of team members
	Location     string    `json:"location"`     // remote, onsite, hybrid
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Application struct {
	gorm.Model
	StudentID     uint    `json:"student_id" gorm:"uniqueIndex:idx_student_project"`
	ProjectID     uint    `json:"project_id" gorm:"uniqueIndex:idx_student_project"`
	Status        string  `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	ProjectTitle  string  `json:"project_title"`                   // Direct project title for easier queries
	GithubRepoURL string  `json:"github_repo_url"`                 // Auto-created GitHub repository URL
	Student       User    `gorm:"foreignKey:StudentID"`
	Project       Project `gorm:"foreignKey:ProjectID"`
}
