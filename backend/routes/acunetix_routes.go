package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
	"github.com/grealyve/lutenix/middlewares"
)

var acunetixController = controller.NewAcunetixController()

func AcunetixRoutes(router *gin.Engine) {
	acunetix := router.Group("/api/v1/acunetix")
	acunetix.Use(middlewares.Authentication(), middlewares.Authorization("scanner", "use"))

	acunetix.GET("/targets", acunetixController.AcunetixGetAllTargets)                     // Read yetkisi?
	acunetix.POST("/targets", acunetixController.AcunetixAddTarget)                        // Create/Update yetkisi?
	acunetix.GET("/scans", acunetixController.AcunetixGetAllScans)                         // Read yetkisi?
	acunetix.GET("/vulnerabilities", acunetixController.AcunetixGetAllVulnerabilities)     // Read yetkisi?
	acunetix.POST("/targets/:target_id/scan", acunetixController.AcunetixTriggerScan)      // Execute/Update yetkisi?
	acunetix.POST("/targets/delete", acunetixController.AcunetixDeleteTargets)             // Delete yetkisi?
	acunetix.GET("/targets/not_scanned", acunetixController.AcunetixGetAllTargetsNotScanned) // Read yetkisi?
}