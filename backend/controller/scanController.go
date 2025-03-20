package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/services"
)

type ScanController struct {
	ScannerService *services.ScannerService
	UserService    *services.UserService
}

func NewScanController() *ScanController {
	return &ScanController{
		ScannerService: &services.ScannerService{},
		UserService:    &services.UserService{},
	}
}

func (sc *ScanController) StartScan(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		Scanner   string `json:"scanner" binding:"required,oneof=acunetix zap"`
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := sc.UserService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't find"})
		return
	}
	logger.Log.Debug("User company ID: ", user.CompanyID, " User ID: ", user.ID)

	scan := models.Scan{
		CompanyID: user.CompanyID,
		CreatedBy: userID,
		Scanner:   request.Scanner,
		TargetURL: request.TargetURL,
		Status:    "pending",
	}

	// Save the scan to database
	if err := database.DB.Create(&scan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner couldn't start"})
		return
	}

	switch request.Scanner {
	case "acunetix":
		err = sc.ScannerService.RunAcunetixScan(request.TargetURL)
	case "zap":
		err = sc.ScannerService.RunZapScan(request.TargetURL)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scanner couldn't start"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Scan started successfully",
		"scan_id": scan.ID,
	})
}
