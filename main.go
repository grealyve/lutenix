package main

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/middlewares"
	"github.com/grealyve/lutenix/routes"
)

func main() {

	router := gin.Default()

	router.Use(gin.Recovery())
	router.Use(middlewares.LoggingMiddleware())
	router.Use(middlewares.CorsMiddleware())
	router.Use(middlewares.Authentication())

	routes.AcunetixRoute(router)
	routes.AdminRoutes(router)
	routes.SemgrepRoutes(router)
	routes.UserRoutes(router)
	routes.ZapRoutes(router)

	router.Run("localhost:8080")

}
