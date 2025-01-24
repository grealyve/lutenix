package controller

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/services"
)

type AuthController struct {
	AuthService *services.AuthService
}

func NewAuthController() *AuthController {
	return &AuthController{
		AuthService: &services.AuthService{},
	}
}

// Login is a function to authenticate the user
func (ac *AuthController) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if c.BindJSON(&body) != nil {
		logger.Log.Println("Invalid request: body doesn't match struct", body.Email, body.Password)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
		})
		return
	}

	var user models.User
	database.DB.First(&user, "email = ?", body.Email)

	if user.ID == [16]byte{} || user.ID == uuid.Nil {
		logger.Log.Errorln("User not found")
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid credentials",
		})
		return
	}

	if !ac.AuthService.CheckPasswordHash(body.Password, user.Password) {
		logger.Log.Errorln("Invalid email or password")
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid email or password",
		})
		return
	}

	token, err := ac.AuthService.GenerateToken(user.ID, user.Role)
	if err != nil {
		logger.Log.Errorln("Error generating token")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "An error occurred",
		})
		return
	}

	// Token'ı JSON yanıtında dön
	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}

func (ac *AuthController) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		logger.Log.Println("Authorization header not found")
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Authorization header not found",
		})
		return
	}

	token := authHeader[7:]

	// Token'ı Redis blacklist'e ekle
	err := database.RedisClient.Set(context.Background(), "blacklist:"+token, true, 24*time.Hour).Err()
	if err != nil {
		logger.Log.Printf("Error adding token to blacklist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error logging out",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}
