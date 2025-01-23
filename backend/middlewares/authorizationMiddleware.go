package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

var permissionMap = map[string]map[string][]string{
	"admin": {
		"scan":    {"create", "read", "update", "delete"},
		"scanner": {"use", "configure"},
		"user":    {"read", "create", "update", "delete"},
	},
	"user": {
		"scan":    {"create", "read", "update", "delete"},
		"scanner": {"use", "configure"},
		"user":    {"read"},
	},
}

func Authorization(resource string, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Authentication middleware'den gelen role'ü al
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Rol bilgisi bulunamadı"})
			c.Abort()
			return
		}

		// Role string'e çevir
		roleStr := role.(string)

		// Role için izinleri kontrol et
		if permissions, ok := permissionMap[roleStr]; ok {
			if resourcePerms, ok := permissions[resource]; ok {
				// İstenen action'ın izinler arasında olup olmadığını kontrol et
				for _, perm := range resourcePerms {
					if perm == action {
						c.Next()
						return
					}
				}
			}
		}

		// İzin yoksa erişimi reddet
		c.JSON(http.StatusForbidden, gin.H{"error": "Bu işlem için yetkiniz bulunmamaktadır"})
		c.Abort()
	}
}
