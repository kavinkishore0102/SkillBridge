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

	controller.InitAuth(db)

	r := router.SetupRouter()
	r.Run(":8080")
}
