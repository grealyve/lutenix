package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
)

func AcunetixRoute(acunetixRoutes *gin.Engine) {
	v1 := acunetixRoutes.Group("/api/v1")
	v1.POST("/acunetix/")
}

func AdminRoutes(adminRoutes *gin.Engine) {
	v1 := adminRoutes.Group("/api/v1")
	v1.POST("/admin/userRegister")

}

func SemgrepRoutes(semgrepRoutes *gin.Engine) {
	v1 := semgrepRoutes.Group("/api/v1")
	v1.GET("/semgrep/")

}

func UserRoutes(userRoutes *gin.Engine, authController *controller.AuthController) {
	v1 := userRoutes.Group("/api/v1")
	v1.POST("/users/login", authController.Login)

}

func ZapRoutes(zapRoutes *gin.Engine) {
	v1 := zapRoutes.Group("/api/v1")
	v1.GET("/zap/")

}
