package main

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/config"
	"github.com/grealyve/lutenix/controller"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/middlewares"
	"github.com/grealyve/lutenix/routes"
)

func main() {

	config.LoadConfig()
	logger.Log.Println("Configuration loaded successfully")
	authController := controller.NewAuthController()

	// Connect to the database
	dsn := "host=" + config.ConfigInstance.DB_HOST +
		" user=" + config.ConfigInstance.DB_USER +
		" password=" + config.ConfigInstance.DB_PASSWORD +
		" dbname=" + config.ConfigInstance.DB_NAME +
		" port=" + config.ConfigInstance.DB_PORT +
		" sslmode=" + config.ConfigInstance.SSLMode
	database.ConnectDB(dsn)
	logger.Log.Println("Database connected successfully")

	database.ConnectRedis("localhost:6379")

	router := gin.Default()

	router.Use(gin.Recovery())
	router.Use(middlewares.LoggingMiddleware())
	router.Use(middlewares.CorsMiddleware())
	router.Use(middlewares.Authentication())

	routes.AcunetixRoute(router)
	routes.AdminRoutes(router)
	routes.SemgrepRoutes(router)
	routes.UserRoutes(router, authController)
	routes.ZapRoutes(router)

	router.Run("localhost:4040")

}
