package routes

import (
	"github.com/gin-gonic/gin"
)

func ZapRoutes(zapRoutes *gin.Engine) {
	v1 := zapRoutes.Group("/api/v1")
	v1.GET("/zap/")

}
