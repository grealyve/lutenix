package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/services"
)

type AcunetixController struct {
	UserService  *services.UserService
	AssetService *services.AssetService
}

func NewAcunetixController() *AcunetixController {
	return &AcunetixController{
		UserService:  &services.UserService{},
		AssetService: &services.AssetService{},
	}
}

// handleAcunetixRequest centralizes user check and error handling for Acunetix endpoints.
func (ac *AcunetixController) handleAcunetixRequest(c *gin.Context, handler func(userID uuid.UUID) (any, error)) {
	userID := c.MustGet("userID").(uuid.UUID)

	_, err := ac.UserService.GetUserByID(userID)
	if err != nil {
		// User check failed, necessary for authorization context.
		logger.Log.Warnf("User not found for ID %s in handleAcunetixRequest", userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	data, err := handler(userID)
	if err != nil {
		// Log Acunetix-specific errors, crucial for debugging integration issues.
		logger.Log.Error("Acunetix request failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix operation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// AcunetixGetAllTargets retrieves all registered Acunetix targets for the user.
func (ac *AcunetixController) AcunetixGetAllTargets(c *gin.Context) {
	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		targets, err := ac.AssetService.GetAllAcunetixTargets(userID)
		if err != nil {
			return nil, err
		}

		targetList := make([]map[string]string, 0, len(targets))
		for address, targetID := range targets {
			targetList = append(targetList, map[string]string{"address": address, "target_id": targetID})
		}
		return targetList, nil
	})
}

// AcunetixAddTarget adds a new target to Acunetix.
func (ac *AcunetixController) AcunetixAddTarget(c *gin.Context) {
	var request struct {
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		ac.AssetService.AddAcunetixTarget(request.TargetURL, userID)
		// Note: Target addition is likely asynchronous.
		return gin.H{"message": "Target addition request sent"}, nil
	})
}

// AcunetixGetAllScans fetches and processes all Acunetix scan data for the user.
func (ac *AcunetixController) AcunetixGetAllScans(c *gin.Context) {
	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		err := ac.AssetService.GetAllAcunetixScan(userID)
		if err != nil {
			return nil, err
		}
		return gin.H{"message": "Scan data fetched and processed"}, nil
	})
}

// AcunetixTriggerScan initiates an Acunetix scan for a specific target.
func (ac *AcunetixController) AcunetixTriggerScan(c *gin.Context) {
	targetID := c.Param("target_id")

	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		ac.AssetService.TriggerAcunetixScan(targetID, userID)
		// Note: Scan triggering is likely asynchronous.
		return gin.H{"message": "Scan triggered"}, nil
	})
}

// AcunetixDeleteTargets requests deletion of specified Acunetix targets.
func (ac *AcunetixController) AcunetixDeleteTargets(c *gin.Context) {
	var request struct {
		TargetIDs []string `json:"target_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		ac.AssetService.DeleteAcunetixTargets(request.TargetIDs, userID)
		// Note: Target deletion is likely asynchronous.
		return gin.H{"message": "Target deletion request sent"}, nil
	})
}

// AcunetixGetAllTargetsNotScanned retrieves all Acunetix targets (potentially including unscanned).
func (ac *AcunetixController) AcunetixGetAllTargetsNotScanned(c *gin.Context) {
	ac.handleAcunetixRequest(c, func(userID uuid.UUID) (any, error) {
		targets, err := ac.AssetService.GetAllTargetsAcunetix(userID)
		if err != nil {
			return nil, err
		}

		targetList := make([]map[string]string, 0, len(targets))
		for address, targetID := range targets {
			targetList = append(targetList, map[string]string{"address": address, "target_id": targetID})
		}
		return targetList, nil
	})
}