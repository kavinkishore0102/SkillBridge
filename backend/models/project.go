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
	CompanyID   uint      `json:"company_id"`
	GuideID     *uint     `json:"guide_id,omitempty"` // Optional guide assignment
	Deadline    time.Time `json:"deadline"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Application struct {
	gorm.Model
	StudentID uint    `json:"student_id"`
	ProjectID uint    `json:"project_id"`
	Student   User    `gorm:"foreignKey:StudentID"`
	Project   Project `gorm:"foreignKey:ProjectID"`
}
