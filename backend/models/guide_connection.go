package models

import (
	"time"
	"gorm.io/gorm"
)

type GuideConnectionRequest struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	StudentID uint           `json:"student_id" gorm:"not null;index"`
	GuideID   uint           `json:"guide_id" gorm:"not null;index"`
	Status    string         `json:"status" gorm:"default:'pending'"` // pending, accepted, rejected
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Student User `json:"student" gorm:"foreignKey:StudentID"`
	Guide   User `json:"guide" gorm:"foreignKey:GuideID"`
}
