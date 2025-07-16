package utils

import (
	"SkillBridge/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log"
)

func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil // REMOVED LOGGING
}

func CheckPassword(storedHash, plainPassword string) bool {
	log.Printf("storedHash: %s", storedHash)
	log.Printf("plainPassword: %s", plainPassword)
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(plainPassword))
	if err != nil {
		log.Printf("bcrypt comparison error: %v", err)
	} else {
		log.Printf("bcrypt comparison succeeded")
	}
	return err == nil
}

func CreateNotification(db *gorm.DB, userID uint, message string) error {
	notification := models.Notification{
		UserID:  userID,
		Message: message,
		Read:    false,
	}
	return db.Create(&notification).Error
}
