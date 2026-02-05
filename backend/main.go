package main

import (
	"SkillBridge/config"
	"SkillBridge/controller"
	"SkillBridge/models"
	"SkillBridge/router"
	"os"
)

func main() {
	db := config.ConnectDB()
	db.AutoMigrate(&models.User{})
	db.AutoMigrate(&models.Project{})
	db.AutoMigrate(&models.Application{})
	db.AutoMigrate(&models.Submission{})
	db.AutoMigrate(&models.Notification{})
	db.AutoMigrate(&models.Chat{})
	db.AutoMigrate(&models.GuideConnectionRequest{})
	db.AutoMigrate(&models.JobListing{})
	db.AutoMigrate(&models.JobApplication{})
	db.AutoMigrate(&models.UserSavedJob{})
	controller.InitAuth(db)
	controller.InitJobDB(db)
	//setup router
	r := router.SetupRouter()
	
	// Use PORT environment variable if set, otherwise default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
