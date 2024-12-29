package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/grealyve/lutenix/backend/services"
)

type ScanController struct {
	ScannerService *services.ScannerService
}

func (sc *ScanController) StartScan(c *gin.Context) {
	var request struct {
		Scanner   string `json:"scanner" binding:"required"`
		TargetURL string `json:"target_url" binding:"required"`
		APIKey    string `json:"api_key" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	switch request.Scanner {
	case "acunetix":
		err := sc.ScannerService.RunAcunetixScan(request.TargetURL, request.APIKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix scan failed"})
			return
		}
	case "semgrep":
		err := sc.ScannerService.RunSemgrepScan(request.TargetURL, "default-ruleset")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Semgrep scan failed"})
			return
		}
	case "zap":
		err := sc.ScannerService.RunZapScan(request.TargetURL, request.APIKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ZAP scan failed"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan started successfully"})
}
