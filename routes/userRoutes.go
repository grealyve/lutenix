package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/controller"
)

func UserRoutes(userRoutes *gin.Engine) {
	v1 := userRoutes.Group("/api/v1")
	v1.POST("/users/login", controller.Login)

}
