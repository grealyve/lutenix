package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
	"github.com/grealyve/lutenix/middlewares"
)

var (
	scanController   = controller.NewScanController()
	userController   = controller.NewUserController()
	assetController  = controller.NewAssetController()
	reportController = controller.NewReportController()
)

func AcunetixRoutes(acunetixRoutes *gin.Engine) {
	acunetix := acunetixRoutes.Group("/api/v1/acunetix")
	acunetix.Use(middlewares.Authentication(), middlewares.Authorization("scanner", "use"))

	acunetix.GET("/targets", scanController.AcunetixGetAllTargets)
	acunetix.POST("/targets", scanController.AcunetixAddTarget)
	acunetix.GET("/scans", scanController.AcunetixGetAllScans)
	acunetix.POST("/targets/:target_id/scan", scanController.AcunetixTriggerScan) // Trigger a scan
	acunetix.POST("/targets/delete", scanController.AcunetixDeleteTargets)
	acunetix.GET("/targets/not_scanned", scanController.AcunetixGetAllTargetsNotScanned)
}

func AdminRoutes(adminRoutes *gin.Engine) {
	v1 := adminRoutes.Group("/api/v1/admin")
	v1.POST("/register", userController.RegisterUser)
	v1.DELETE("/deleteUser", middlewares.Authentication(), middlewares.Authorization("user", "delete"), userController.RegisterUser)

}

func SemgrepRoutes(semgrepRoutes *gin.Engine) {
	semgrep := semgrepRoutes.Group("/api/v1/semgrep")
	semgrep.Use(middlewares.Authentication(), middlewares.Authorization("scanner", "use"))

	semgrep.GET("/scanDetails", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepScanDetails)     // Requires scan_id and deployment_id in request body
	semgrep.GET("/deployments", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepListDeployments) // No parameters
	semgrep.GET("/projects", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepListProjects)       // Requires deployment_slug as a query parameter
	semgrep.GET("/scans", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepListScans)             // Requires deployment_id as a query parameter
	semgrep.GET("/findings", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepListFindings)       // Requires deployment_slug as a query parameter
	semgrep.GET("/secrets", middlewares.Authentication(), middlewares.Authorization("scanner", "read"), scanController.SemgrepListSecrets)         // Requires deployment_id as a query parameter
}

func UserRoutes(userRoutes *gin.Engine, authController *controller.AuthController) {
	user := userRoutes.Group("/api/v1/users")
	user.POST("/login", authController.Login)
	user.GET("/logout", middlewares.Authentication(), middlewares.Authorization("user", "logout"), authController.Logout)
	user.GET("/profile", middlewares.Authentication(), middlewares.Authorization("user", "read"), userController.GetMyProfile)
	user.POST("/updateProfile", middlewares.Authentication(), middlewares.Authorization("user", "update"), userController.UpdateProfile)
	user.POST("/updateScanner", middlewares.Authentication(), middlewares.Authorization("user", "update"), userController.UpdateScannerSetting)

}

func ZapRoutes(zapRoutes *gin.Engine) {
	zap := zapRoutes.Group("/api/v1/zap")
	zap.Use(middlewares.Authentication(), middlewares.Authorization("scanner", "use"))

	// Scan Management
	zap.GET("/scans/:scan_id/status", scanController.ZapGetScanStatus) // Get scan status
	zap.GET("/scans/:scan_id/spider_status", scanController.ZapGetZapSpiderStatus)
	zap.PUT("/scans/:scan_id/pause", scanController.ZapPauseScan) // Pause scan
	zap.DELETE("/scans/:scan_id", scanController.ZapRemoveScan)   // Remove scan
	zap.GET("/scans/:scan_id", scanController.ZapGetZapScanStatus)

	// Start scan (using dedicated endpoint)
	zap.POST("/scans", scanController.ZapStartScan)

	zap.GET("/alerts/:scan_id", scanController.ZapGetAlerts) // Get alerts for a scan
	zap.GET("/alerts/detail/:alert_id", scanController.ZapGetAlertDetail)

	zap.GET("/results", scanController.GetZapScanResultsByURL)

	zap.POST("/report", reportController.GenerateZAPReport)
}
