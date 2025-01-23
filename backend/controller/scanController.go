package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
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
	// Kullanıcı bilgilerini al
	userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		Scanner   string `json:"scanner" binding:"required"`
		TargetURL string `json:"target_url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Kullanıcının şirket bilgisini al
	user, err := sc.UserService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kullanıcı bilgileri alınamadı"})
		return
	}

	// Yeni tarama kaydı oluştur
	scan := models.Scan{
		CompanyID: user.CompanyID,
		CreatedBy: userID,
		Scanner:   request.Scanner,
		TargetURL: request.TargetURL,
		Status:    "pending",
	}

	// Taramayı başlat
	apiKey, err := sc.UserService.GetUserAPIKey(userID, request.Scanner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "API anahtarı alınamadı"})
		return
	}

	// Taramayı veritabanına kaydet ve başlat
	if err := database.DB.Create(&scan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tarama kaydedilemedi"})
		return
	}

	// Scanner'a göre taramayı başlat
	switch request.Scanner {
	case "acunetix":
		err = sc.ScannerService.RunAcunetixScan(request.TargetURL, apiKey)
	case "semgrep":
		err = sc.ScannerService.RunSemgrepScan(request.TargetURL, apiKey)
	case "zap":
		err = sc.ScannerService.RunZapScan(request.TargetURL, apiKey)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Geçersiz tarayıcı"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tarama başlatılamadı"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tarama başarıyla başlatıldı",
		"scan_id": scan.ID,
	})
}
