package router

import (
	"SkillBridge/controller"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.POST("/signup", controller.SignUp)
		api.POST("/login", controller.Login)
	}
	return r
}
