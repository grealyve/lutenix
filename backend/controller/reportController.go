package controller

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/services"
)

type ReportController struct {
	ReportService *services.ReportService
	UserService   *services.UserService
}

func NewReportController() *ReportController {
	userService := &services.UserService{}
	scanService := &services.ScanService{}
	assetService := &services.AssetService{}
	reportService := services.NewReportService(userService, scanService, assetService)
	
	return &ReportController{
		ReportService: reportService,
		UserService:   userService,
	}
}

type GenerateZapReportRequest struct {
	Title string   `json:"title" binding:"required"`
	Sites []string `json:"sites" binding:"required"`
}

func (rc *ReportController) CreateReport(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var request struct {
		ScanIDs []string `json:"scan_ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorf("Body couldn't bind: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Kullanıcının şirket bilgisini al
	user, err := rc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Errorf("User couldn't find %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kullanıcı bulunamadı"})
		return
	}

	// Rapor oluştur
	rc.ReportService.CreateAcunetixReport(request.ScanIDs, userID)

	// Rapor indirme linkini al
	downloadLink, err := rc.ReportService.GetReportDownloadLinkAcunetix(user.CompanyID.String())
	if err != nil {
		logger.Log.Errorf("Couldn't create a Acunetix report download link: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Raporu veritabanına kaydet
	report := models.Report{
		CompanyID:    user.CompanyID,
		ScanID:       uuid.MustParse(request.ScanIDs[0]),
		DownloadLink: downloadLink,
		ReportType:   "acunetix",
	}

	if err := database.DB.Create(&report).Error; err != nil {
		logger.Log.Errorf("Report couldn't save %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Report couldn't save"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Report creation successful",
		"report":  report,
	})
}

func (rc *ReportController) GetReports(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	// Kullanıcının şirket bilgisini al
	user, err := rc.UserService.GetUserByID(userID)
	if err != nil {
		logger.Log.Errorf("User couldn't find %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User couldn't find"})
		return
	}

	var reports []models.Report
	if err := database.DB.Where("company_id = ?", user.CompanyID).Find(&reports).Error; err != nil {
		logger.Log.Errorln("Reports couldn't fecth from database:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Reports couldn't fecth from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reports": reports})
}

func (rc *ReportController) GenerateZAPReport(c *gin.Context) {
	logTag := "Controller.GenerateZAPReport"
	logger.Log.Debugf("[%s] Endpoint called", logTag)

	userID := c.MustGet("userID").(uuid.UUID)
	logger.Log.Debugf("[%s] Called for UserID: %s", logTag, userID)

	var request GenerateZapReportRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		logger.Log.Errorf("[%s] Invalid request body: %v", logTag, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}
	logger.Log.Debugf("[%s] Request body validated: %+v", logTag, request)

	if len(request.Sites) == 0 {
		logger.Log.Errorf("[%s] No target sites provided", logTag)
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one target site must be provided"})
		return
	}

	_, errUser := rc.UserService.GetUserByID(userID)
	if errUser != nil {
		logger.Log.Warnf("[%s] User not found for ID %s", logTag, userID)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	reportPath, err := rc.ReportService.GenerateZAPReport(
		userID,
		request.Title,
		request.Sites,
	)

	if err != nil {
		logger.Log.Errorf("[%s] Error calling ReportService.GenerateZAPReport: %v", logTag, err)
		if strings.Contains(err.Error(), "couldn't get ZAP settings") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Could not retrieve ZAP scanner settings for the user."})
		} else if strings.Contains(err.Error(), "ZAP API error") || strings.Contains(err.Error(), "ZAP API failed") {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to generate report via ZAP API: " + err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate ZAP report: " + err.Error()})
		}
		return
	}

	logger.Log.Infof("[%s] ZAP report generated successfully for UserID %s. Path: %s", logTag, userID, reportPath)
	c.JSON(http.StatusOK, gin.H{
		"message":     "ZAP report generation request successful",
		"report_path": reportPath,
	})
}
