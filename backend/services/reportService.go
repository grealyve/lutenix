package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/utils"
)

var (
	reportsResponseModel = models.ReportsResponsePage{}
	groupNameReportIdMap = make(map[string]models.ReportResponse)
)

const template_id = "11111111-1111-1111-1111-111111111111"

type ReportService struct {
	AssetService *AssetService
}

func (r *ReportService) NewReportService() *ReportService {
	return &ReportService{
		AssetService: &AssetService{},
	}
}

func (r *ReportService) GetAcunetixReports(userID uuid.UUID) {
	resp, err := utils.SendGETRequestAcunetix("/api/v1/reports?l=99", userID)
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
		// TODO: Change this mechanism
		time.Sleep(3 * time.Minute)
	}

	return groupNameReportIdMap[groupName].Status == "completed"
}

// Create a report for a list of scans
func (r *ReportService) CreateAcunetixReport(targetSlice []string, userID uuid.UUID) {
	assetService := &AssetService{}

	var scannedIDs []string
	for _, targetID := range targetSlice {
		if assetService.IsScannedTargetAcunetix(targetID, userID) {
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

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/reports", reportJSON, userID)
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

/*
Report Generate ZAP
http://localhost:8081/JSON/reports/action/generate/?apikey=6f1ebonoa9980csb8ls2895rl0&title=test&template=modern&theme=&description=&contexts=&sites=http%3A%2F%2Fabdiibrahim.com&sections=&includedConfidences=&includedRisks=&reportFileName=&reportFileNamePattern=&reportDir=&display=

Result:
{
  "generate": "C:\\Users\\Grealyve\\2025-02-03-ZAP-Report-abdiibrahim.com.html"
}
*/

func (r *ReportService) GenerateZAPReport(userID uuid.UUID, targetSites string) (string, error) {
	logTag := "GenerateZAPReport"
	logger.Log.Debugf("[%s] Called for UserID: %s, Sites: %s", logTag, userID, targetSites)

	// 1. ZAP Ayarlarını Al
	scannerSetting, err := r.AssetService.getUserScannerZAPSettings(userID)
	if err != nil {
		logger.Log.Errorf("[%s] Error getting ZAP settings for UserID %s: %v", logTag, userID, err)
		return "", fmt.Errorf("couldn't get ZAP settings: %w", err)
	}
	logger.Log.Debugf("[%s] ZAP settings retrieved: URL=%s, Port=%d", logTag, scannerSetting.ScannerURL, scannerSetting.ScannerPort)

	queryParams := url.Values{}
	queryParams.Add("apikey", scannerSetting.APIKey)
	queryParams.Add("sites", targetSites) // Birden fazla site virgülle ayrılmış olmalı

	endpointPath := "/JSON/reports/action/generate/"
	fullURL := fmt.Sprintf("%s:%d%s", scannerSetting.ScannerURL, scannerSetting.ScannerPort, endpointPath)
	encodedQuery := queryParams.Encode()

	logger.Log.Debugf("[%s] Sending ZAP report generation request to: %s with query: %s", logTag, fullURL, encodedQuery)
	requestPathWithQuery := fmt.Sprintf("%s?%s", endpointPath, encodedQuery)

	resp, err := utils.SendGETRequestZap(requestPathWithQuery, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorf("[%s] Error creating HTTP request: %v", logTag, err)
		return "", fmt.Errorf("failed to create report request: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("[%s] Error reading ZAP response body: %v", logTag, err)
		return "", fmt.Errorf("failed to read ZAP response: %w", err)
	}
	logger.Log.Debugf("[%s] ZAP Response Status: %s, Body: %s", logTag, resp.Status, string(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		logger.Log.Errorf("[%s] ZAP API returned non-OK status: %s", logTag, resp.Status)
		return "", fmt.Errorf("ZAP API failed with status %s", resp.Status)
	}

	var result struct {
		Generate string `json:"generate"`
	}

	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		logger.Log.Errorf("[%s] Error decoding ZAP generate report response: %v", logTag, err)
		return "", fmt.Errorf("failed to decode ZAP response: %w", err)
	}

	if result.Generate == "" {
		logger.Log.Warnf("[%s] ZAP response decoded successfully, but 'generate' field is empty.", logTag)
		return "", fmt.Errorf("ZAP did not return a report path")
	}

	logger.Log.Infof("[%s] ZAP report generated successfully at: %s", logTag, result.Generate)
	return result.Generate, nil
}
