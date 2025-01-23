package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	var request struct {
		Scanner   string `json:"scanner" binding:"required"`
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(uuid.UUID)

	apiKey, err := sc.UserService.GetUserAPIKey(userID, request.Scanner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API anahtarı alınamadı"})
		return
	}

	switch request.Scanner {
	case "acunetix":
		err = sc.ScannerService.RunAcunetixScan(request.TargetURL, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix scan failed"})
			return
		}
	case "semgrep":
		err = sc.ScannerService.RunSemgrepScan(request.TargetURL, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Semgrep scan failed"})
			return
		}
	case "zap":
		err = sc.ScannerService.RunZapScan(request.TargetURL, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ZAP scan failed"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tarama başarıyla başlatıldı"})
}
