package utils

import (
	"golang.org/x/crypto/bcrypt"
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
	return err == nil // REMOVED LOGGING
}
