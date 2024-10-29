package routes

import "github.com/gin-gonic/gin"

func AcunetixRoute(acunetixRoutes *gin.Engine) {
	v1 := acunetixRoutes.Group("/api/v1")
	v1.POST("/acunetix/")
}
