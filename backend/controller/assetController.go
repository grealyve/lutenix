package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/services"
)

type AssetController struct {
	AssetService *services.AssetService
	UserService  *services.UserService
}

func NewAssetController() *AssetController {
	return &AssetController{
		AssetService: &services.AssetService{},
		UserService:  &services.UserService{},
	}
}

func (ac *AssetController) GetAssets(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		Scanner string `json:"scanner" binding:"required,oneof=acunetix semgrep zap"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ac.UserService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't find"})
		return
	}

	switch request.Scanner {
	case "acunetix":
		assets, err := ac.AssetService.GetAllTargetsAcunetix()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix targets couldn't fetch"})
			return
		}

		// Fetches data from database
		var scans []models.Scan
		if err := database.DB.Where("company_id = ? AND scanner = ?", user.CompanyID, "acunetix").Find(&scans).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Scan data couldn't get"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"assets": assets,
			"scans":  scans,
		})

	case "semgrep", "zap":
		c.JSON(http.StatusNotImplemented, gin.H{"error": "Unsupported scanner"})
		return

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
		return
	}
}

func (ac *AssetController) DeleteAssets(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		Scanner   string   `json:"scanner" binding:"required,oneof=acunetix zap"`
		TargetIDs []string `json:"target_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ac.UserService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't find"})
		return
	}

	switch request.Scanner {
	case "acunetix":
		ac.AssetService.DeleteAcunetixTargets(request.TargetIDs, userID)

		if err := database.DB.Where("company_id = ? AND scanner = ? AND target_url IN (?)",
			user.CompanyID, "acunetix", request.TargetIDs).
			Delete(&models.Scan{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Assets couldn't be deleted"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Assets successfully deleted"})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
	}
}

func (ac *AssetController) GetZapScanStatus(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	scanID := c.Query("scan_id")
	if scanID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scan_id parameter is required"})
		return
	}

	status, err := ac.AssetService.GetZapScanStatus(scanID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scan status couldn't get"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": status,
	})
}

func (ac *AssetController) GetZapFindings(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	scanID := c.Query("scan_id")
	if scanID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "scan_id parameter is required"})
		return
	}

	alertIDs, err := ac.AssetService.GetZapAlerts(scanID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Alerts couldn't get"})
		return
	}

	var findings []models.Finding
	for _, alertID := range alertIDs {
		finding, err := ac.AssetService.GetZapAlertDetail(alertID, userID)
		if err != nil {
			continue
		}
		findings = append(findings, finding)
	}

	c.JSON(http.StatusOK, gin.H{
		"findings": findings,
	})
}
