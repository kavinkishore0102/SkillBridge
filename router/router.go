package router

import (
	"SkillBridge/controller"
	"SkillBridge/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// 🔓 Public routes
	router.POST("/api/signup", controller.SignUp)
	router.POST("/api/login", controller.Login)

	// 🔍 Publicly accessible project listing
	router.GET("/api/projects", controller.GetAllProjects)

	// ✅ Protected routes
	authorized := router.Group("/api")
	authorized.Use(middleware.AuthMiddleware())
	{
		// Profile routes (for all roles)
		authorized.GET("/profile", controller.GetProfile)
		authorized.PUT("/profile", controller.UpdateProfile)

		// 📤 Only 'company' can post projects
		authorized.POST("/projects", middleware.AuthorizeRoles("company"), controller.PostProject)

		// 🧑‍🎓 Only 'student' can apply to a project
		authorized.POST("/projects/apply", middleware.AuthorizeRoles("student"), controller.ApplyToProject)
	}

	// Start server
	router.Run(":8080")
	return router
}
