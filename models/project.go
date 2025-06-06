package models

import (
	"time"
)

type Project struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Skills      string    `json:"skills"`
	CompanyID   uint      `json:"company_id"`
	Deadline    time.Time `json:"deadline"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
