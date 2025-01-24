package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/config"
)

func Authentication() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yetkilendirme başlığı eksik"})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.ConfigInstance.SECRET), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims okunamadı"})
			c.Abort()
			return
		}

		// User ID'yi UUID'ye çevir
		userID, err := uuid.Parse(claims["id"].(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Geçersiz kullanıcı ID"})
			c.Abort()
			return
		}

		// Kullanıcı bilgilerini context'e ekle
		c.Set("userID", userID)
		c.Set("role", claims["role"])

		c.Next()
	}
}
