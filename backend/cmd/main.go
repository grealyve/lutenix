package main

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/backend/config"
	"github.com/grealyve/lutenix/backend/database"
	"github.com/grealyve/lutenix/backend/logger"
	"github.com/grealyve/lutenix/backend/middlewares"
	"github.com/grealyve/lutenix/backend/routes"
)

func main() {

	config.LoadConfig()
	logger.Log.Println("Configuration loaded successfully")

	// Connect to the database
	dsn := "host=" + config.ConfigInstance.DB_HOST +
		" user=" + config.ConfigInstance.DB_USER +
		" password=" + config.ConfigInstance.DB_PASSWORD +
		" dbname=" + config.ConfigInstance.DB_NAME +
		" port=" + config.ConfigInstance.DB_PORT +
		" sslmode=" + config.ConfigInstance.SSLMode
	database.ConnectDB(dsn)
	logger.Log.Println("Database connected successfully")

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

	router.Run("localhost:4040")

}
