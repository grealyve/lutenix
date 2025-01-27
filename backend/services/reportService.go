package services

import (
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/utils"
)

var (
	reportsResponseModel = models.ReportsResponsePage{}
	groupNameReportIdMap = make(map[string]models.ReportResponse)
)

const template_id = "11111111-1111-1111-1111-111111111111"

type ReportService struct{}

func (r *ReportService) NewReportService() *ReportService {
	return &ReportService{}
}

func (r *ReportService) GetAcunetixReports() {
	resp, err := utils.SendGETRequestAcunetix("/api/v1/reports?l=99")
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		logger.Log.Errorln(string(body))
		logger.Log.Errorln("Response Status:", resp.Status)
	}

	json.Unmarshal(body, &reportsResponseModel)

}

func (r *ReportService) IsAcunetixReportCreationCompleted(groupName string) bool {
	if groupNameReportIdMap[groupName].Status == "queued" || groupNameReportIdMap[groupName].Status == "processing" {
		time.Sleep(3 * time.Minute)
	}

	return groupNameReportIdMap[groupName].Status == "completed"
}

// Create a report for a list of scans
func (r *ReportService) CreateAcunetixReport(targetSlice []string) {
	assetService := &AssetService{}

	var scannedIDs []string
	for _, targetID := range targetSlice {
		if assetService.IsScannedTargetAcunetix(targetID) {
			scannedIDs = append(scannedIDs, targetIdScanIdMap[targetID])
		}
	}

	creatingReportModel := models.GenerateReport{
		TemplateID: template_id,
		Source: models.Source{
			ListType: "scans",
			IDList:   scannedIDs,
		},
	}

	reportJSON, err := json.Marshal(creatingReportModel)
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
		return
	}

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/reports", reportJSON)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorln("Error reading response body:", err)
		return
	}

	if resp.StatusCode == 201 {
		logger.Log.Infoln("Report has been created successfully")
	} else {
		logger.Log.Errorln("Response Body:", string(body))
		return
	}
}

func (r *ReportService) GetReportDownloadLinkAcunetix(groupName string) (string, error) {
	if !r.IsAcunetixReportCreationCompleted(groupName) {
		return "", fmt.Errorf("report is not ready yet")
	}

	// Get download links
	if len(groupNameReportIdMap[groupName].Download) > 0 {
		return groupNameReportIdMap[groupName].Download[0], nil
	}

	return "", fmt.Errorf("download links couldn't find")
}
