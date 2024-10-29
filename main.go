package main

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/middlewares"
)

func main() {

	router := gin.Default()
	router.Use(gin.Recovery())
	router.Use(middlewares.LoggingMiddleware())
	router.Use(middlewares.CorsMiddleware())


    router.Run("localhost:8080")

}
