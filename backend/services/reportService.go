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

func GetAcunetixReports() {
	resp, err := utils.SendGETRequestAcunetix("/api/v1/reports?l=100")
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		fmt.Println(string(body))
		fmt.Println("Response Status:", resp.Status)
	}

	json.Unmarshal(body, &reportsResponseModel)

}

func IsAcunetixReportCreationCompleted(groupName string) bool {
	if groupNameReportIdMap[groupName].Status == "queued" || groupNameReportIdMap[groupName].Status == "processing" {
		time.Sleep(3 * time.Minute)
	}

	return groupNameReportIdMap[groupName].Status == "completed"
}

// Create a report for a list of scans
func CreateAcunetixReport(targetSlice []string) {
	// Check if the report is already created for the group

	var scannedIDs []string

	for _, targetID := range targetSlice {
		if IsScannedTargetAcunetix(targetID) {
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
