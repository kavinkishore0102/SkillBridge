package router

import (
	"SkillBridge/controller"
	"SkillBridge/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Set trusted proxies - only trust localhost for development
	// In production, set this to your actual proxy IPs
	router.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 🔓 Public routes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Backend is running"})
	})
	router.POST("/api/signup", controller.SignUp)
	router.POST("/api/login", controller.Login)
	router.POST("/api/google-oauth", controller.GoogleOAuth)

	// 🔍 Publicly accessible project listing
	router.GET("/api/projects", controller.GetAllProjects)
	router.GET("/api/projects/:id", controller.GetProjectById)
	router.GET("/api/student/:id", controller.GetPublicStudentProfile)
	router.GET("/api/company/:id", controller.GetPublicCompanyProfile)
	router.GET("/api/guides", controller.GetAllGuides)

	// ✅ Protected routes
	authorized := router.Group("/api")
	// router/router.go
	authorized.GET("/dashboard/admin", middleware.AuthorizeRoles("admin"), controller.AdminDashboard)

	authorized.Use(middleware.AuthMiddleware())
	{
		// Profile routes (for all roles)
		authorized.GET("/profile", controller.GetProfile)
		authorized.PUT("/profile", controller.UpdateProfile)
		authorized.POST("/refresh-token", controller.RefreshToken)
		
		// GitHub integration routes
		authorized.POST("/github/token", controller.SetGithubToken)
		authorized.DELETE("/github/token", controller.RemoveGithubToken)

		// 📤 Only 'company' can post projects
		authorized.POST("/projects", middleware.AuthorizeRoles("company"), controller.PostProject)
		authorized.DELETE("/projects/:id", middleware.AuthorizeRoles("company"), controller.DeleteProject)
		authorized.DELETE("/projects/:id/apply", middleware.AuthorizeRoles("student"), controller.WithdrawApplication)

		// 🧑‍🎓 Only 'student' can apply to a project
		authorized.POST("/projects/apply", middleware.AuthorizeRoles("student"), controller.ApplyToProject)
		authorized.POST("/projects/submit-github", middleware.AuthorizeRoles("student"), controller.SubmitGithubRepo)
		authorized.GET("/projects/:id/applicants", middleware.AuthorizeRoles("company"), controller.GetProjectApplicants)

		authorized.POST("/projects/:id/submit", middleware.AuthorizeRoles("student"), controller.SubmitProject)
		authorized.GET("/projects/:id/submissions", middleware.AuthorizeRoles("company"), controller.GetProjectSubmissions)
		authorized.POST("/submissions/:id/review", middleware.AuthorizeRoles("company"), controller.ReviewSubmission)
		authorized.GET("/my-submissions", middleware.AuthorizeRoles("student"), controller.GetMySubmissions)
		authorized.GET("/dashboard/student", middleware.AuthorizeRoles("student"), controller.StudentDashboard)
		authorized.GET("/dashboard/company", middleware.AuthorizeRoles("company"), controller.CompanyDashboard)
		authorized.GET("/dashboard/guide", middleware.AuthorizeRoles("guide"), controller.GuideDashboard)
		authorized.GET("/company/applications", middleware.AuthorizeRoles("company"), controller.GetCompanyApplications)
		authorized.GET("/company/projects", middleware.AuthorizeRoles("company"), controller.GetCompanyProjects)
		authorized.GET("/my-applications", middleware.AuthorizeRoles("student"), controller.GetMyApplications)
		authorized.GET("/guide/submissions", middleware.AuthorizeRoles("guide"), controller.GetGuideSubmissions)
		authorized.PUT("/submissions/:id/review", middleware.AuthorizeRoles("company", "guide"), controller.ReviewSubmission)

		// 💬 Chat routes
		authorized.POST("/chat/start", middleware.AuthorizeRoles("student"), controller.StartConversation)
		authorized.POST("/chat/send", middleware.AuthorizeRoles("student", "guide"), controller.SendMessage)
		authorized.GET("/chat/history/:student_id/:guide_id", middleware.AuthorizeRoles("student", "guide"), controller.GetChatHistory)
		authorized.GET("/chat/conversations", middleware.AuthorizeRoles("student", "guide"), controller.GetUserConversations)
		authorized.GET("/chat/connected-guides", middleware.AuthorizeRoles("student"), controller.GetConnectedGuides)

	}

	return router
}
