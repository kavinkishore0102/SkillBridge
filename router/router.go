package router

import (
	"SkillBridge/controller"
	"SkillBridge/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Public routes
	router.POST("/api/signup", controller.SignUp)
	router.POST("/api/login", controller.Login)

	// ✅ Protected routes
	authorized := router.Group("/api")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.GET("/profile", controller.GetProfile)
		authorized.PUT("/profile", controller.UpdateProfile)
	}

	// Start the server
	router.Run(":8080")
	return router
}
