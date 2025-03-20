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
	v1 := acunetixRoutes.Group("/api/v1/acunetix")
	v1.POST("/", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	v1.GET("/getAssets", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), assetController.GetAssets)
}

func AdminRoutes(adminRoutes *gin.Engine) {
	v1 := adminRoutes.Group("/api/v1/admin")
	v1.POST("/register", userController.RegisterUser)
	v1.DELETE("/deleteUser", middlewares.Authentication(), middlewares.Authorization("scanner", "use"),userController.RegisterUser)

}

func SemgrepRoutes(semgrepRoutes *gin.Engine) {
	semgrep := semgrepRoutes.Group("/api/v1/semgrep")
	semgrep.POST("/listScans", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	semgrep.GET("/scanDetails", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	semgrep.GET("/deployments", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	semgrep.GET("/projects", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	semgrep.GET("/findings", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
	semgrep.GET("/secrets", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), scanController.StartScan)
}

func UserRoutes(userRoutes *gin.Engine, authController *controller.AuthController) {
	v1 := userRoutes.Group("/api/v1/users")
	v1.POST("/login", authController.Login)
	v1.GET("/logout", middlewares.Authentication(), authController.Logout)
	v1.GET("/profile", middlewares.Authentication(), userController.GetMyProfile)
	v1.POST("/updateProfile", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), userController.UpdateProfile)
	v1.POST("/updateScanner", middlewares.Authentication(), middlewares.Authorization("scanner", "use"), userController.UpdateScannerSetting)

}

func ZapRoutes(zapRoutes *gin.Engine) {
	v1 := zapRoutes.Group("/api/v1/zap")
	v1.GET("/startScan", middlewares.Authentication(), middlewares.Authorization("scanner", "create"), scanController.StartScan)
	v1.GET("/scanStatus", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), assetController.GetZapScanStatus)
	v1.GET("/findings", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), assetController.GetZapFindings)

}