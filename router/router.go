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
	router.GET("/api/student/:id", controller.GetPublicStudentProfile)
	router.GET("/api/company/:id", controller.GetPublicCompanyProfile)

	// ✅ Protected routes
	authorized := router.Group("/api")
	// router/router.go
	authorized.GET("/dashboard/admin", middleware.AuthorizeRoles("admin"), controller.AdminDashboard)

	authorized.Use(middleware.AuthMiddleware())
	{
		// Profile routes (for all roles)
		authorized.GET("/profile", controller.GetProfile)
		authorized.PUT("/profile", controller.UpdateProfile)
		router.GET("/api/company/:id", controller.GetPublicCompanyProfile)

		// 📤 Only 'company' can post projects
		authorized.POST("/projects", middleware.AuthorizeRoles("company"), controller.PostProject)
		authorized.DELETE("/projects/:id", middleware.AuthorizeRoles("company"), controller.DeleteProject)
		authorized.DELETE("/projects/:id/apply", middleware.AuthorizeRoles("student"), controller.WithdrawApplication)

		// 🧑‍🎓 Only 'student' can apply to a project
		authorized.POST("/projects/apply", middleware.AuthorizeRoles("student"), controller.ApplyToProject)
		authorized.GET("/projects/:id/applicants", middleware.AuthorizeRoles("company"), controller.GetProjectApplicants)

		authorized.POST("/projects/:id/submit", middleware.AuthorizeRoles("student"), controller.SubmitProject)
		authorized.GET("/projects/:id/submissions", middleware.AuthorizeRoles("company"), controller.GetProjectSubmissions)
		authorized.POST("/submissions/:id/review", middleware.AuthorizeRoles("company"), controller.ReviewSubmission)
		authorized.GET("/my-submissions", middleware.AuthorizeRoles("student"), controller.GetMySubmissions)
		authorized.GET("/dashboard/student", middleware.AuthorizeRoles("student"), controller.StudentDashboard)
		authorized.GET("/dashboard/company", middleware.AuthorizeRoles("company"), controller.CompanyDashboard)
		authorized.GET("/company/applications", middleware.AuthorizeRoles("company"), controller.GetCompanyApplications)
		authorized.GET("/my-applications", middleware.AuthorizeRoles("student"), controller.GetMyApplications)
		authorized.GET("/guide/submissions", middleware.AuthorizeRoles("guide"), controller.GetGuideSubmissions)

	}

	// Start server
	router.Run(":8080")
	return router
}
