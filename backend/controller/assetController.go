package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
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
	// userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		Scanner string `json:"scanner" binding:"required,oneof=acunetix semgrep zap"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// apiKey, err := ac.UserService.GetUserAPIKey(userID, request.Scanner)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "API anahtarı alınamadı"})
	// 	return
	// }

	switch request.Scanner {
	case "acunetix":
		assets, err := ac.AssetService.GetAllTargetsAcunetix()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Acunetix scan failed"})
		}
		c.JSON(http.StatusOK, gin.H{"Assets": assets})
	case "semgrep":

	case "zap":

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scanner"})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scan started successfully"})
}
