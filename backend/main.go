package main

import (
	"SkillBridge/config"
	"SkillBridge/controller"
	"SkillBridge/models"
	"SkillBridge/router"
)

func main() {
	db := config.ConnectDB()
	db.AutoMigrate(&models.User{})
	db.AutoMigrate(&models.Project{})
	db.AutoMigrate(&models.Application{})
	db.AutoMigrate(&models.Submission{})
	db.AutoMigrate(&models.Notification{})
	controller.InitAuth(db)
	//setup router
	r := router.SetupRouter()
	r.Run(":8080")
}
