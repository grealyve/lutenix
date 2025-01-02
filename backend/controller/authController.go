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

func (ac *AuthController) Signup(c *gin.Context) {
	var body struct {
		Email    string    `json:"email"`
		Password string    `json:"password"`
		Role     string    `json:"role"`
		Company  uuid.UUID `json:"company"`
	}

	if c.BindJSON(&body) != nil {
		logger.Log.Errorln("Invalid request")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	hashedPassword, err := ac.AuthService.HashPassword(body.Password)
	if err != nil {
		logger.Log.Errorln("Error hashing password")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "An error occurred",
		})
		return
	}

	user := models.User{
		Email:     body.Email,
		Password:  hashedPassword,
		Role:      body.Role,
		CompanyID: body.Company,
	}

	database.DB.Create(&user)

	logger.Log.Debugln("User created successfully")
	c.JSON(200, gin.H{
		"user":    user,
		"message": "User created successfully",
	})
}

// Login is a function to authenticate the user
func (ac *AuthController) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if c.BindJSON(&body) != nil {
		logger.Log.Println("Invalid request")
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
		})
		return
	}

	var user models.User
	database.DB.First(&user, "email = ?", body.Email)

	// TODO: Burası kesin yanlıştır 0'a eşit olmalıydı...
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

	c.SetCookie("token", token, 86400, "/", "", false, true)
	c.JSON(200, gin.H{
		"token": token,
	})
}

func (ac *AuthController) Logout(c *gin.Context) {
	token, err := c.Cookie("token")
	if err != nil {
		logger.Log.Println("Token not found")
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Token not found",
		})
		return
	}

	// Add token to Redis blacklist with expiration
	err = database.RedisClient.Set(context.Background(), "blacklist:"+token, true, 24*time.Hour).Err()
	if err != nil {
		logger.Log.Printf("Error adding token to blacklist: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Error logging out",
		})
		return
	}

	// Clear cookie
	c.SetCookie("token", "", -1, "/", "", false, true)
	err = database.AddTokenToBlacklist(token)
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
