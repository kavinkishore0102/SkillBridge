package models

import (
	"gorm.io/gorm"
	"time"
)

type Project struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Skills      string    `json:"skills"`
	Budget      string    `json:"budget"`
	CompanyID   uint      `json:"company_id"`
	GuideID     *uint     `json:"guide_id,omitempty"` // Optional guide assignment
	Deadline    time.Time `json:"deadline"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Application struct {
	gorm.Model
	StudentID    uint    `json:"student_id"`
	ProjectID    uint    `json:"project_id"`
	Status       string  `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	ProjectTitle string  `json:"project_title"`                   // Direct project title for easier queries
	Student      User    `gorm:"foreignKey:StudentID"`
	Project      Project `gorm:"foreignKey:ProjectID"`
}
