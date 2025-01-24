package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
	"github.com/grealyve/lutenix/middlewares"
)

var (
	scanController  = controller.NewScanController()
	userController  = controller.NewUserController()
	assetController = controller.NewAssetController()
)

func AcunetixRoute(acunetixRoutes *gin.Engine) {
	v1 := acunetixRoutes.Group("/api/v1")
	v1.POST("/acunetix/", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	v1.GET("/acunetix/getAssets", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), assetController.GetAssets)
}

func AdminRoutes(adminRoutes *gin.Engine) {
	v1 := adminRoutes.Group("/api/v1")
	v1.POST("/admin/register", userController.RegisterUser)

}

func SemgrepRoutes(semgrepRoutes *gin.Engine) {
	v1 := semgrepRoutes.Group("/api/v1")
	v1.GET("/semgrep/", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
}

func UserRoutes(userRoutes *gin.Engine, authController *controller.AuthController) {
	v1 := userRoutes.Group("/api/v1")
	v1.POST("/users/login", authController.Login)
	v1.GET("/profile", middlewares.Authentication(), userController.GetMyProfile)

}

func ZapRoutes(zapRoutes *gin.Engine) {
	v1 := zapRoutes.Group("/api/v1")
	v1.GET("/zap/", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
}

func ScanRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	v1.POST("/scan", middlewares.Authentication(), middlewares.Authorization("scan", "create"), scanController.StartScan)
}
