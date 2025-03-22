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
		logger.Log.Error("Semgrep request failed:", err)                                   // Log the actual error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Semgrep operation failed"}) // Generic error message to client
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (sc *ScanController) StartScan(c *gin.Context) {
	logger.Log.Debugln("StartScan endpoint called") // Debug: Entry Point
	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("StartScan called for user ID: %s", userID)

	var request struct {
		Scanner   string `json:"scanner" binding:"required,oneof=acunetix zap semgrep"` // Include semgrep
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for StartScan:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("StartScan request: %+v", request) // Log the request body

	user, err := sc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Warnf("User not found for ID %s in StartScan", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"}) // 404 for user not found
		return
	}
	logger.Log.Debugf("User company ID: %s, User ID: %s", user.CompanyID, user.ID)

	scan := models.Scan{
		CompanyID: user.CompanyID,
		CreatedBy: userID,
		Scanner:   request.Scanner,
		TargetURL: request.TargetURL,
		Status:    "pending",
	}

	if err := database.DB.Create(&scan).Error; err != nil {
		logger.Log.Errorln("Failed to create scan record:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate scan"})
		return
	}
	logger.Log.Infof("Created scan record: %+v", scan)

	var scanID interface{}

	switch request.Scanner {
	case "acunetix":
		logger.Log.Debugln("Starting Acunetix scan")
		//Find target id from the given url and trigger scan by id
		targets, err := sc.AssetService.GetAllAcunetixTargets(userID)
		if err != nil {
			logger.Log.Errorln("Error fetching Acunetix targets:", err)                                   // Log the error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve Acunetix targets"}) // Generic error
			return
		}
		if targetID, ok := targets[request.TargetURL]; ok {
			sc.AssetService.TriggerAcunetixScan(targetID, userID)
			scanID = targetID
			logger.Log.Infof("Triggered Acunetix scan for target ID: %s", targetID)
		} else {
			logger.Log.Warnf("Acunetix target not found for URL: %s", request.TargetURL)
			c.JSON(http.StatusNotFound, gin.H{"error": "Acunetix target couldn't found"})
			return
		}
	case "zap":
		logger.Log.Debugln("Starting ZAP scan")
		startModel, err := sc.AssetService.StartZAPScan(request.TargetURL, userID)
		if err != nil {
			logger.Log.Errorln("Failed to start ZAP scan:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start ZAP scan"})
			return
		}
		scanID = startModel.ZapVulnScanID
		logger.Log.Infof("Started ZAP scan. Vulnerability scan ID: %s", scanID)
	case "semgrep":
		logger.Log.Debugln("Starting Semgrep scan (placeholder)")
		//  Semgrep doesn't "start" a scan in the same way.  You likely need to
		//  trigger a scan via their API, or this might be a placeholder for
		//  later integration with a CI/CD pipeline.  For now, I'll assume
		//  it's a placeholder and just return the scan ID.
		scanID = scan.ID //  Database ID.
		logger.Log.Infof("Semgrep scan initiated (placeholder).  Scan ID: %s", scanID)

	default:
		logger.Log.Warnf("Invalid scanner specified: %s", request.Scanner)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
		return
	}

	// The following `if` condition is unnecessary, and has been removed.  Error handling
	// is done within each `case` block above.  We *always* want to return a 200 OK
	// (or appropriate error) if we get to this point.

	c.JSON(http.StatusOK, gin.H{
		"message": "Scan started successfully",
		"scan_id": scanID,
	})
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

// handleZapRequest is a helper like handleSemgrepRequest, but for ZAP.
func (sc *ScanController) handleZapRequest(c *gin.Context, handler func(userID uuid.UUID) (interface{}, error)) {
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

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		scan, err := sc.AssetService.StartZAPScan(request.TargetURL, userID)
		if err != nil {
			return nil, err // handleZapRequest will handle the error
		}
		return gin.H{"scan_id": scan.ID, "zap_spider_scan_id": scan.ZapSpiderScanID, "zap_vuln_scan_id": scan.ZapVulnScanID}, nil
	})
}

func (sc *ScanController) ZapGetScanStatus(c *gin.Context) {
	logger.Log.Debugln("ZapGetScanStatus endpoint called") // Debug: Entry Point
	scanIDStr := c.Param("scan_id")                        // Get scanID from the URL parameter.
	scanID, err := uuid.Parse(scanIDStr)
	if err != nil {
		logger.Log.Warnf("Invalid scan ID format in ZapGetScanStatus: %s", scanIDStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scan ID format"})
		return
	}
	logger.Log.Debugf("ZapGetScanStatus called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		status, err := sc.AssetService.CheckZAPScanStatus(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"scan_id": scanID, "status": status}, nil
	})
}

func (sc *ScanController) ZapPauseScan(c *gin.Context) {
	logger.Log.Debugln("ZapPauseScan endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapPauseScan called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		finding, err := sc.AssetService.GetZapAlertDetail(alertID, userID)
		if err != nil {
			return nil, err
		}
		return finding, nil // Return the full finding details directly.
	})
}

func (sc *ScanController) ZapAddZapSpiderURL(c *gin.Context) {
	logger.Log.Debugln("ZapAddZapSpiderURL endpoint called") // Debug: Entry Point
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for ZapAddZapSpiderURL:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("ZapAddZapSpiderURL request: %+v", request)

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		result, err := sc.AssetService.AddZapSpiderURL(request.TargetURL, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"spider_id": result}, nil
	})
}

func (sc *ScanController) ZapAddZapScanURL(c *gin.Context) {
	logger.Log.Debugln("ZapAddZapScanURL endpoint called") // Debug: Entry Point
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorln("Invalid request body for ZapAddZapScanURL:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	logger.Log.Debugf("ZapAddZapScanURL request: %+v", request)

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		result, err := sc.AssetService.AddZapScanURL(request.TargetURL, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"scan_id": result}, nil
	})
}

func (sc *ScanController) ZapGetZapScanStatus(c *gin.Context) {
	logger.Log.Debugln("ZapGetZapScanStatus endpoint called") // Debug: Entry Point
	scanID := c.Param("scan_id")
	logger.Log.Debugf("ZapGetZapScanStatus called with scan ID: %s", scanID)

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleZapRequest(c, func(userID uuid.UUID) (interface{}, error) {
		result, err := sc.AssetService.GetZapSpiderStatus(scanID, userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"status": result}, nil
	})
}

func (sc *ScanController) handleAcunetixRequest(c *gin.Context, handler func(userID uuid.UUID) (interface{}, error)) {
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
	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
		sc.AssetService.AddAcunetixTarget(request.TargetURL, userID)
		return gin.H{"message": "Target addition request sent"}, nil // Acknowledge receipt.
	})
}

func (sc *ScanController) AcunetixGetAllScans(c *gin.Context) {
	logger.Log.Debugln("AcunetixGetAllScans endpoint called") // Debug: Entry Point
	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
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

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
		sc.AssetService.DeleteAcunetixTargets(request.TargetIDs, userID)
		return gin.H{"message": "Target deletion request sent"}, nil
	})
}

func (sc *ScanController) AcunetixGetAllTargetsNotScanned(c *gin.Context) {
	logger.Log.Debugln("AcunetixGetAllTargetsNotScanned endpoint called") // Debug: Entry point

	sc.handleAcunetixRequest(c, func(userID uuid.UUID) (interface{}, error) {
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
