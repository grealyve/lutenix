package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func Authorization(resource string, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID") // Authentication middleware'inden al
		role, _ := c.Get("role")

		requestedUserID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz kaynak ID"})
			c.Abort()
			return
		}

		if resource == "user" && action == "read" {
			if role != "admin" && userID != requestedUserID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Bu kaynağa erişim yetkiniz yok"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
