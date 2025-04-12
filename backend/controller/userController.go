package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
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
		Name     string `json:"name" binding:"required"`
		Surname  string `json:"surname" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	logger.Log.Debugln("RegisterUser endpoint called")

	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorln("Invalid registration request", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	logger.Log.Debugf("RegisterUser request body: %+v", body)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Log.Errorln("Password hashing failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed: " + err.Error()})
		return
	}

	exists, err := uc.UserService.EmailExists(body.Email)
	if err != nil {
		logger.Log.Errorln("Email check failed in database query", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Email check failed: " + err.Error()})
		return
	}
	if exists {
		logger.Log.Infoln("Registration attempted with existing email:", body.Email)
		c.JSON(http.StatusConflict, gin.H{"error": "This email already in use"})
		return
	}

	// Get or create default company for users
	defaultCompanyName := "Default Company"
	companyID, err := uc.UserService.GetOrCreateCompany(defaultCompanyName)
	if err != nil {
		logger.Log.Errorln("Default company creation or retrieval failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Default company creation failed: " + err.Error()})
		return
	}
	logger.Log.Debugf("Using default company ID: %s", companyID)

	user := models.User{
		Name:      body.Name,
		Surname:   body.Surname,
		Email:     body.Email,
		Password:  string(hashedPassword),
		Role:      "user",
		CompanyID: companyID,
	}

	err = uc.UserService.RegisterUser(user)
	if err != nil {
		logger.Log.Errorln("User couldn't be saved", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't be saved: " + err.Error()})
		return
	}

	logger.Log.Infoln("User registered successfully:", user.Email)

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"surname":    user.Surname,
			"email":      user.Email,
			"role":       user.Role,
			"company_id": user.CompanyID,
		},
	})
}

func (uc *UserController) CreateCompany(c *gin.Context) {
	logger.Log.Debugln("CreateCompany endpoint called")

	// Safely get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		logger.Log.Errorln("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userIDUUID, ok := userID.(uuid.UUID)
	if !ok {
		logger.Log.Errorln("Invalid user ID format in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	logger.Log.Debugf("User ID: %s attempting to create company", userIDUUID)

	var body struct {
		CompanyName string `json:"company_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorln("Invalid company creation request", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	logger.Log.Debugf("Company creation request body: %+v", body)

	exists, err := uc.UserService.CompanyExistsByName(body.CompanyName)
	if err != nil {
		logger.Log.Errorln("Company existence check failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Company check failed: " + err.Error()})
		return
	}

	if exists {
		logger.Log.Infoln("Company creation attempted with existing name:", body.CompanyName)
		c.JSON(http.StatusConflict, gin.H{"error": "Company with this name already exists"})
		return
	}

	companyID, err := uc.UserService.CreateCompany(body.CompanyName)
	if err != nil {
		logger.Log.Errorln("Company creation failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Company creation failed: " + err.Error()})
		return
	}

	logger.Log.Infoln("Company created successfully:", body.CompanyName, "with ID:", companyID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Company created successfully",
		"company": gin.H{
			"id":   companyID,
			"name": body.CompanyName,
		},
	})
}

func (uc *UserController) AddUserToCompany(c *gin.Context) {
	logger.Log.Debugln("AddUserToCompany endpoint called")

	// Safely get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		logger.Log.Errorln("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	adminID, ok := userID.(uuid.UUID)
	if !ok {
		logger.Log.Errorln("Invalid user ID format in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	logger.Log.Debugf("User ID: %s attempting to add user to company", adminID)

	var body struct {
		Email       string `json:"email" binding:"required,email"`
		CompanyName string `json:"company_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorln("Invalid add user to company request", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	logger.Log.Debugf("Add user to company request body: %+v", body)

	user, err := uc.UserService.GetUserByEmail(body.Email)
	if err != nil {
		logger.Log.Errorln("User not found:", body.Email, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found with the provided email"})
		return
	}

	// Check if company exists by name
	exists, err = uc.UserService.CompanyExistsByName(body.CompanyName)
	if err != nil {
		logger.Log.Errorln("Company check failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Company check failed: " + err.Error()})
		return
	}

	if !exists {
		logger.Log.Errorln("Company not found:", body.CompanyName)
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found with the provided name"})
		return
	}

	// Get company ID by name
	companyID, err := uc.UserService.GetCompanyIDByName(body.CompanyName)
	if err != nil {
		logger.Log.Errorln("Failed to get company ID", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get company ID: " + err.Error()})
		return
	}

	if err := uc.UserService.UpdateUserCompany(user.ID, companyID); err != nil {
		logger.Log.Errorln("Failed to add user to company", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add user to company: " + err.Error()})
		return
	}

	logger.Log.Infoln("User", user.Email, "successfully added to company", body.CompanyName)

	c.JSON(http.StatusOK, gin.H{
		"message": "User successfully added to company",
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
		"company_name": body.CompanyName,
	})
}

func (uc *UserController) GetMyProfile(c *gin.Context) {
	logger.Log.Debugln("GetMyProfile endpoint called")

	userID, exists := c.Get("userID")
	if !exists {
		logger.Log.Errorln("User ID couldn't find in context") 
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID couldn't find in context"})
		return
	}

	userIDUUID, ok := userID.(uuid.UUID)
	if !ok {
		logger.Log.Errorln("UUID conversion failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "UUID conversion failed"})
		return
	}
	logger.Log.Debugf("Current user ID: %s", userIDUUID)

	user, err := uc.UserService.GetUserByID(userIDUUID)
	if err != nil {
		logger.Log.Infoln("User not found for current user:", userIDUUID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User couldn't find"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (uc *UserController) UpdateProfile(c *gin.Context) {
	logger.Log.Debugln("UpdateProfile endpoint called") 
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("UpdateProfile for user ID: %s", userID)

	var body struct {
		Name    string `json:"name"`
		Surname string `json:"surname"`
		Email   string `json:"email"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorln("Invalid request body for UpdateProfile", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}
	logger.Log.Debugf("UpdateProfile request body: %+v", body)

	if body.Email != "" {
		exists, err := uc.UserService.EmailExists(body.Email)
		if err != nil {
			logger.Log.Errorln("Email existence check failed during profile update", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Email check couldn't complete"})
			return
		}
		if exists {
			logger.Log.Infoln("Profile update attempted with existing email:", body.Email)
			c.JSON(http.StatusConflict, gin.H{"error": "This email address is already in use"})
			return
		}
	}

	if err := uc.UserService.UpdateUser(userID, body.Name, body.Surname, body.Email); err != nil {
		logger.Log.Errorln("User update failed during query", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Profile couldn't update"})
		return
	}

	logger.Log.Infoln("Profile updated successfully for user:", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (uc *UserController) UpdateScannerSetting(c *gin.Context) {
	logger.Log.Debugln("UpdateScannerSetting endpoint called") // Debug: Entry point
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("Updating scanner settings for user ID: %s", userID)

	var body struct {
		Scanner     string `json:"scanner" binding:"required,oneof=acunetix semgrep zap"`
		APIKey      string `json:"api_key" binding:"required"`
		ScannerURL  string `json:"scanner_url"`
		ScannerPort int    `json:"scanner_port"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		logger.Log.Errorln("Invalid UpdateScannerSetting request", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	logger.Log.Debugf("UpdateScannerSetting request body: %+v", body)

	user, err := uc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Errorln("User data couldn't be retrieved for scanner setting update", err)
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
		logger.Log.Errorln("Scanner settings update failed", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner couldn't update"})
		return
	}

	logger.Log.Infoln("Scanner settings updated successfully for user:", userID) // Info: Success
	c.JSON(http.StatusOK, gin.H{"message": "Scanner settings updated successfully"})
}

func (uc *UserController) GetScannerSetting(c *gin.Context) {
	logger.Log.Debugln("GetScannerSetting endpoint called") // Debug: Entry Point
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("Retrieving scanner settings for user ID: %s", userID)

	scannerSetting, err := uc.UserService.GetScannerSetting(userID)
	if err != nil {
		logger.Log.Errorln("Scanner data couldn't be retrieved", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner data couldn't find"})
		return
	}

	c.JSON(http.StatusOK, scannerSetting)
}
