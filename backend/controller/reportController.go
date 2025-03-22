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

type ReportController struct {
	ReportService *services.ReportService
	UserService   *services.UserService
}

func NewReportController() *ReportController {
	return &ReportController{
		ReportService: &services.ReportService{},
		UserService:   &services.UserService{},
	}
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
		ScanID:       uuid.MustParse(request.ScanIDs[0]), // İlk scan ID'yi kullan
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
