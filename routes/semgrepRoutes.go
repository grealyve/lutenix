package routes

import "github.com/gin-gonic/gin"

func SemgrepRoutes(semgrepRoutes *gin.Engine) {
	v1 := semgrepRoutes.Group("/api/v1")
	v1.GET("/semgrep/")

}
