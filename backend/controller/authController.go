package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/backend/database"
	"github.com/grealyve/lutenix/backend/models"
	"github.com/grealyve/lutenix/backend/services"
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
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
		})
		return
	}

	hashedPassword, err := ac.AuthService.HashPassword(body.Password)
	if err != nil {
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

	c.JSON(200, gin.H{
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
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid request",
		})
		return
	}

	var user models.User
	database.DB.First(&user, "email = ?", body.Email)

	// TODO: Burası kesin yanlıştır 0'a eşit olmalıydı...
	if user.ID == [16]byte{} {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid credentials",
		})
		return
	}

	if !ac.AuthService.CheckPasswordHash(body.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Invalid email or password",
		})
		return
	}

	token, err := ac.AuthService.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "An error occurred",
		})
		return
	}

	c.JSON(200, gin.H{
		"token": token,
	})
}
