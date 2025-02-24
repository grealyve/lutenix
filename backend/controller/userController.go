package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/services"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	UserService *services.UserService
}

func NewUserController() *UserController {
	return &UserController{
		UserService: &services.UserService{},
	}
}

func (uc *UserController) RegisterUser(c *gin.Context) {
	var body struct {
		Name        string `json:"name" binding:"required"`
		Surname     string `json:"surname" binding:"required"`
		Email       string `json:"email" binding:"required,email"`
		Password    string `json:"password" binding:"required,min=6"`
		Role        string `json:"role" binding:"required,oneof=admin user"`
		CompanyName string `json:"company_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed: " + err.Error()})
		return
	}

	exists, err := uc.UserService.EmailExists(body.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Email check failed: " + err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "This email already in use"})
		return
	}

	companyID, err := uc.UserService.GetOrCreateCompany(body.CompanyName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Company creation failed: " + err.Error()})
		return
	}

	user := models.User{
		Name:      body.Name,
		Surname:   body.Surname,
		Email:     body.Email,
		Password:  string(hashedPassword),
		Role:      body.Role,
		CompanyID: companyID,
	}

	err = uc.UserService.RegisterUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't be saved: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": gin.H{
			"id":           user.ID,
			"name":         user.Name,
			"surname":      user.Surname,
			"email":        user.Email,
			"role":         user.Role,
			"company_id":   user.CompanyID,
			"company_name": body.CompanyName,
		},
	})
}

func (uc *UserController) GetUserProfile(c *gin.Context) {
	requestedUserID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := uc.UserService.GetUserByID(requestedUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User couldn't find"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": map[string]interface{}{
			"id":         user.ID,
			"email":      user.Email,
			"role":       user.Role,
			"company_id": user.CompanyID,
		},
	})
}

func (uc *UserController) GetMyProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID couldn't find in context"})
		return
	}

	userIDUUID, ok := userID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "UUID conversion failed"})
		return
	}

	user, err := uc.UserService.GetUserByID(userIDUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User couldn't find"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (uc *UserController) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var body struct {
		Name    string `json:"name"`
		Surname string `json:"surname"`
		Email   string `json:"email"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if body.Email != "" {
		exists, err := uc.UserService.EmailExists(body.Email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Email check couldn't complete"})
			return
		}
		if exists {
			c.JSON(http.StatusConflict, gin.H{"error": "This email address is already in use"})
			return
		}
	}
	
	if err := uc.UserService.UpdateUser(userID, body.Name, body.Surname, body.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Profile couldn't update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (uc *UserController) UpdateScannerSetting(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var body struct {
		Scanner     string `json:"scanner" binding:"required,oneof=acunetix semgrep zap"`
		APIKey      string `json:"api_key" binding:"required"`
		ScannerURL  string `json:"scanner_url"`
		ScannerPort int    `json:"scanner_port"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	user, err := uc.UserService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User data couldn't find"})
		return
	}

	scannerSetting := models.ScannerSetting{
		CreatedBy:   userID,
		CompanyID:   user.CompanyID,
		Scanner:     body.Scanner,
		APIKey:      body.APIKey,
		ScannerURL:  body.ScannerURL,
		ScannerPort: body.ScannerPort,
	}

	if err := uc.UserService.UpdateScannerSetting(scannerSetting); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner couldn't update"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scanner settings updated successfully"})
}

func (uc *UserController) GetScannerSetting(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	scannerSetting, err := uc.UserService.GetScannerSetting(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner data couldn't find"})
		return
	}

	c.JSON(http.StatusOK, scannerSetting)
}
