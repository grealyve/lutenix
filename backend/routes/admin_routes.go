package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
	"github.com/grealyve/lutenix/middlewares"
)

var (
	userController = controller.NewUserController()
)

func AdminRoutes(router *gin.Engine) {
	admin := router.Group("/api/v1/admin")

	admin.POST("/register", userController.RegisterUser)

	adminAuthenticated := admin.Use(middlewares.Authentication())
	{
		// adminAuthenticated.DELETE("/deleteUser", middlewares.Authorization("user", "delete"), userController.DeleteUser)
		adminAuthenticated.POST("/createCompany", middlewares.Authorization("user", "create"), userController.CreateCompany)
		adminAuthenticated.POST("/addCompanyUser", middlewares.Authorization("user", "update"), userController.AddUserToCompany) 
		adminAuthenticated.POST("/makeAdmin", middlewares.Authorization("user", "update"), userController.MakeAdmin)
		adminAuthenticated.POST("/makeUser", middlewares.Authorization("user", "update"), userController.MakeUser)
		adminAuthenticated.POST("/deleteUser", middlewares.Authorization("user", "delete"), userController.DeleteUser)
		adminAuthenticated.GET("/getUsers", middlewares.Authorization("user", "read"), userController.GetUsers)
	}

}