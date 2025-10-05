package models

import (
	"time"
	"gorm.io/gorm"
)

type Chat struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	StudentID  uint      `json:"student_id" gorm:"not null"`
	GuideID    uint      `json:"guide_id" gorm:"not null"`
	Message    string    `json:"message" gorm:"type:text;not null"`
	SenderID   uint      `json:"sender_id" gorm:"not null"` // ID of the user who sent the message
	SenderRole string    `json:"sender_role" gorm:"not null"` // "student" or "guide"
	IsRead     bool      `json:"is_read" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Associations
	Student User `json:"student" gorm:"foreignKey:StudentID"`
	Guide   User `json:"guide" gorm:"foreignKey:GuideID"`
	Sender  User `json:"sender" gorm:"foreignKey:SenderID"`
}

type ChatConversation struct {
	StudentID    uint      `json:"student_id"`
	GuideID      uint      `json:"guide_id"`
	StudentName  string    `json:"student_name"`
	GuideName    string    `json:"guide_name"`
	LastMessage  string    `json:"last_message"`
	LastSender   string    `json:"last_sender"`
	LastSentAt   time.Time `json:"last_sent_at"`
	UnreadCount  int       `json:"unread_count"`
}