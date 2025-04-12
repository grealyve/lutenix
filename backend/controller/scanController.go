package controller

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/services"
	"gorm.io/gorm"
)

type ScanController struct {
	ScannerService *services.ScannerService
	UserService    *services.UserService
	AssetService   *services.AssetService
}

func NewScanController() *ScanController {
	return &ScanController{
		ScannerService: &services.ScannerService{},
		UserService:    &services.UserService{},
		AssetService:   &services.AssetService{},
	}
}

// handleSemgrepRequest is a helper function to reduce code duplication.
func (sc *ScanController) handleSemgrepRequest(c *gin.Context, handler func(userID uuid.UUID) (any, error)) {
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("handleSemgrepRequest called for user ID: %s", userID)

	_, err := sc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Warnf("User not found for ID %s in handleSemgrepRequest", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"}) // More specific error
		return
	}

	data, err := handler(userID)
	if err != nil {
		logger.Log.Error("Semgrep request failed:", err)                                             // Log the actual error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Semgrep operation failed (handler)"}) // Generic error message to client
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (sc *ScanController) SemgrepScanDetails(c *gin.Context) {
	logger.Log.Debugln("SemgrepScanDetails endpoint called") // Debug Entry Point

	var request struct {
		ScanID       int    `json:"scan_id" binding:"required"`
		DeploymentID string `json:"deployment_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for SemgrepScanDetails:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("SemgrepScanDetails request: %+v", request)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepGetScanDetails(request.DeploymentID, request.ScanID, userID)
	})
}

func (sc *ScanController) SemgrepListDeployments(c *gin.Context) {
	logger.Log.Debugln("SemgrepListDeployments endpoint called") // Debug: Entry Point
	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListDeployments(userID)
	})
}

func (sc *ScanController) SemgrepListProjects(c *gin.Context) {
	logger.Log.Debugln("SemgrepListProjects endpoint called") // Debug: Entry Point
	deploymentSlug := c.Query("deployment_slug")              // Get from query parameter
	if deploymentSlug == "" {
		logger.Log.Warnln("deployment_slug is required for SemgrepListProjects")
		c.JSON(http.StatusBadRequest, gin.H{"error": "deployment_slug is required"})
		return
	}
	logger.Log.Debugf("SemgrepListProjects called with deployment_slug: %s", deploymentSlug)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListProjects(deploymentSlug, userID)
	})
}

func (sc *ScanController) SemgrepListScans(c *gin.Context) {
	logger.Log.Debugln("SemgrepListScans endpoint called") // Debug: Entry Point
	deploymentID := c.Query("deployment_id")
	if deploymentID == "" {
		logger.Log.Warnln("deployment_id is required for SemgrepListScans")
		c.JSON(http.StatusBadRequest, gin.H{"error": "deployment_id is required"})
		return
	}
	logger.Log.Debugf("SemgrepListScans called with deployment_id: %s", deploymentID)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListScans(deploymentID, userID)
	})
}

func (sc *ScanController) SemgrepListFindings(c *gin.Context) {
	logger.Log.Debugln("SemgrepListFindings endpoint called") // Debug: Entry Point
	deploymentSlug := c.Query("deployment_slug")
	if deploymentSlug == "" {
		logger.Log.Warnln("deployment_slug is required for SemgrepListFindings")
		c.JSON(http.StatusBadRequest, gin.H{"error": "deployment_slug is required"})
		return
	}
	logger.Log.Debugf("SemgrepListFindings called with deployment_slug: %s", deploymentSlug)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListFindings(deploymentSlug, userID)
	})
}

func (sc *ScanController) SemgrepListSecrets(c *gin.Context) {
	logger.Log.Debugln("SemgrepListSecrets endpoint called") // Debug: Entry Point
	deploymentID := c.Query("deployment_id")
	if deploymentID == "" {
		logger.Log.Warnln("deployment_id is required for SemgrepListSecrets")
		c.JSON(http.StatusBadRequest, gin.H{"error": "deployment_id is required"})
		return
	}
	logger.Log.Debugf("SemgrepListSecrets called with deployment_id: %s", deploymentID)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListSecrets(deploymentID, userID)
	})
}

func (sc *ScanController) SemgrepListRepositories(c *gin.Context) {
	logger.Log.Debugln("SemgrepListRepositories endpoint called")
	deploymentID := c.Query("deployment_id")
	if deploymentID == "" {
		logger.Log.Warnln("deployment_id is required for SemgrepListRepositories")
		c.JSON(http.StatusBadRequest, gin.H{"error": "deployment_id is required"})
		return
	}
	logger.Log.Debugf("SemgrepListRepositories called with deployment_id: %s", deploymentID)

	sc.handleSemgrepRequest(c, func(userID uuid.UUID) (any, error) {
		return sc.AssetService.SemgrepListRepositories(deploymentID, userID)
	})
}

// handleZapRequest is a helper like handleSemgrepRequest, but for ZAP.
func (sc *ScanController) handleZapRequest(c *gin.Context, handler func(userID uuid.UUID) (any, error)) {
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("handleZapRequest called for user ID: %s", userID)

	_, err := sc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Warnf("User not found for ID %s in handleZapRequest", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	data, err := handler(userID)
	if err != nil {
		logger.Log.Error("ZAP request failed:", err) // Specific ZAP error logging.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ZAP operation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// ZapStartScan is an alternative to using /scan for starting a scan specifically for ZAP.
func (sc *ScanController) ZapStartScan(c *gin.Context) {
	logger.Log.Debugln("ZapStartScan endpoint called") // Debug: Entry Point
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for ZapStartScan:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("ZapStartScan request: %+v", request)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		scan, err := sc.AssetService.StartZAPScan(request.TargetURL, userID)
		if err != nil {
			return nil, err // handleZapRequest will handle the error
		}
		return gin.H{"scan_id": scan.ID, "zap_spider_scan_id": scan.ZapSpiderScanID, "zap_vuln_scan_id": scan.ZapVulnScanID}, nil
	})
}

// ZapGetScanStatus fonksiyonu zaten doğru şekilde DB UUID'sini bekliyor.
// URL'den alınan scanIDStr'nin Parse edilmesi doğru.
func (sc *ScanController) ZapGetScanStatus(c *gin.Context) {
	logger.Log.Debugln("ZapGetScanStatus endpoint called")
	scanIDStr := c.Param("scan_id")      // Get scanID from the URL parameter.
	scanID, err := uuid.Parse(scanIDStr) // DB UUID'sini parse etmeyi dene
	if err != nil {
		logger.Log.Warnf("Invalid scan ID format in ZapGetScanStatus: %s", scanIDStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scan ID format (expected UUID)"}) // Hata mesajını netleştir
		return
	}
	logger.Log.Debugf("ZapGetScanStatus called with DB scan ID: %s", scanID) // Log mesajını düzelt

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		// CheckZAPScanStatus DB UUID'si ile çalışmalı
		status, err := sc.AssetService.CheckZAPScanStatus(scanID, userID)
		if err != nil {
			// Eğer hata "scan not found" ise 404 dönmek daha uygun olabilir
			if errors.Is(err, gorm.ErrRecordNotFound) || err.Error() == "scan not found" {
				logger.Log.Warnf("Scan not found in DB for ID %s in ZapGetScanStatus", scanID)
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Scan not found in database"})
				return nil, fmt.Errorf("aborting") // handleZapRequest'in devam etmemesi için
			}
			return nil, err // Diğer hatalar 500 olarak dönecek
		}
		return gin.H{"scan_id": scanID, "status": status}, nil
	})
}

func (sc *ScanController) ZapPauseScan(c *gin.Context) {
	logger.Log.Debugln("ZapPauseScan endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapPauseScan called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		result, err := sc.AssetService.PauseZapScan(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"result": result}, nil // Consistent response format.
	})
}

func (sc *ScanController) ZapRemoveScan(c *gin.Context) {
	logger.Log.Debugln("ZapRemoveScan endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapRemoveScan called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		result, err := sc.AssetService.RemoveZapScan(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"result": result}, nil
	})
}

func (sc *ScanController) ZapGetAlerts(c *gin.Context) {
	logger.Log.Debugln("ZapGetAlerts endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapGetAlerts called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		alertIDs, err := sc.AssetService.GetZapAlerts(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"alert_ids": alertIDs}, nil
	})
}

func (sc *ScanController) ZapGetAlertDetail(c *gin.Context) {
	logger.Log.Debugln("ZapGetAlertDetail endpoint called") // Debug: Entry Point
	alertID := c.Param("alert_id")
	logger.Log.Debugf("ZapGetAlertDetail called with alert ID: %s", alertID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		finding, err := sc.AssetService.GetZapAlertDetail(alertID, userID)
		if err != nil {
			return nil, err
		}
		return finding, nil // Return the full finding details directly.
	})
}

func (sc *ScanController) ZapGetZapScanStatus(c *gin.Context) {
	logger.Log.Debugln("ZapGetZapScanStatus endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapGetZapScanStatus called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		result, err := sc.AssetService.GetZapScanStatus(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"status": result}, nil
	})
}

func (sc *ScanController) ZapGetZapSpiderStatus(c *gin.Context) {
	logger.Log.Debugln("ZapGetZapSpiderStatus endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapGetZapSpiderStatus called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		result, err := sc.AssetService.GetZapSpiderStatus(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"status": result}, nil
	})
}

func (sc *ScanController) ListZapScans(c *gin.Context) {
	logger.Log.Debugln("ListZapScans endpoint called")

	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		scanList, err := sc.AssetService.ListZapScansForUser(userID)
		if err != nil {
			logger.Log.Errorf("Error fetching ZAP scan list in controller: %v", err)
			return nil, err
		}
		return gin.H{"scans": scanList}, nil
	})
}

// GetZapScanResultsByURL retrieves the latest completed scan results for a given target URL.
func (sc *ScanController) GetZapScanResultsByURL(c *gin.Context) {
	logger.Log.Debugln("GetZapScanResultsByURL endpoint called")

	targetURL := c.Query("target_url")
	if targetURL == "" {
		logger.Log.Warn("GetZapScanResultsByURL called without target_url query parameter")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'target_url' query parameter"})
		return
	}

	logger.Log.Debugf("GetZapScanResultsByURL called for target URL: %s", targetURL)

	// Use the existing handleZapRequest helper
	sc.handleZapRequest(c, func(userID uuid.UUID) (any, error) {
		findings, err := sc.AssetService.FetchAndSaveZapFindingsByURL(targetURL, userID)
		if err != nil {
			// Specific handling for "user not found" or other service errors if needed
			if err.Error() == "user not found" {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return nil, fmt.Errorf("aborting") // Prevent handleZapRequest from sending 500
			}
			logger.Log.Errorf("Error in GetScanResultsByURL service call: %v", err)
			// Let handleZapRequest handle other errors as Internal Server Error
			return nil, err
		}

		return gin.H{"findings": findings}, nil // Return the findings directly.
	})
}

func (sc *ScanController) handleAcunetixRequest(c *gin.Context, handler func(userID uuid.UUID) (any, error)) {
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("handleAcunetixRequest called for user ID: %s", userID)

	_, err := sc.UserService.GetUserByID(userID) // Check if user exists.
	if err != nil {
		logger.Log.Warnf("User not found for ID %s in handleAcunetixRequest", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	data, err := handler(userID)
	if err != nil {
		logger.Log.Error("Acunetix request failed:", err) // Log Acunetix-specific errors.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix operation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (sc *ScanController) AcunetixGetAllTargets(c *gin.Context) {
	logger.Log.Debugln("AcunetixGetAllTargets endpoint called") // Debug: Entry Point
	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		targets, err := sc.AssetService.GetAllAcunetixTargets(userID)
		if err != nil {
			return nil, err
		}

		// Transform the map to a more suitable response format (if needed)
		targetList := make([]map[string]string, 0, len(targets))
		for address, targetID := range targets {
			targetList = append(targetList, map[string]string{"address": address, "target_id": targetID})
		}
		return targetList, nil // Return an array of objects, not a map.
	})
}

func (sc *ScanController) AcunetixAddTarget(c *gin.Context) {
	logger.Log.Debugln("AcunetixAddTarget endpoint called")
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for AcunetixAddTarget:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("AcunetixAddTarget request: %+v", request)

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		sc.AssetService.AddAcunetixTarget(request.TargetURL, userID)
		return gin.H{"message": "Target addition request sent"}, nil // Acknowledge receipt.
	})
}

func (sc *ScanController) AcunetixGetAllScans(c *gin.Context) {
	logger.Log.Debugln("AcunetixGetAllScans endpoint called") // Debug: Entry Point
	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		err := sc.AssetService.GetAllAcunetixScan(userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"message": "Scan data fetched and processed"}, nil
	})
}
func (sc *ScanController) AcunetixTriggerScan(c *gin.Context) {
	logger.Log.Debugln("AcunetixTriggerScan endpoint called")
	targetID := c.Param("target_id") // Get target_id from the URL parameter
	logger.Log.Debugf("AcunetixTriggerScan called with target ID: %s", targetID)

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		sc.AssetService.TriggerAcunetixScan(targetID, userID)
		return gin.H{"message": "Scan triggered"}, nil // Simple acknowledgement
	})
}

func (sc *ScanController) AcunetixDeleteTargets(c *gin.Context) {
	logger.Log.Debugln("AcunetixDeleteTargets endpoint called") // Debug: Entry point
	var request struct {
		TargetIDs []string `json:"target_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for AcunetixDeleteTargets:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("AcunetixDeleteTargets request: %+v", request)

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		sc.AssetService.DeleteAcunetixTargets(request.TargetIDs, userID)
		return gin.H{"message": "Target deletion request sent"}, nil
	})
}

func (sc *ScanController) AcunetixGetAllTargetsNotScanned(c *gin.Context) {
	logger.Log.Debugln("AcunetixGetAllTargetsNotScanned endpoint called") // Debug: Entry point

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		targets, err := sc.AssetService.GetAllTargetsAcunetix()
		if err != nil {
			return nil, err
		}

		// Transform the map to a more suitable response format (if needed)
		targetList := make([]map[string]string, 0, len(targets))
		for address, targetID := range targets {
			targetList = append(targetList, map[string]string{"address": address, "target_id": targetID})
		}
		return targetList, nil // Return an array of objects, not a map.
	})
}
