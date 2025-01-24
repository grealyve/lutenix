package services

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/utils"
	"gorm.io/gorm"
)

var (
	DB *gorm.DB

	triggerModel = models.TriggerScan{
		ProfileID: "11111111-1111-1111-1111-111111111111",
		Schedule: models.Schedule{
			Disable:       false,
			StartDate:     nil,
			TimeSensitive: false,
		},
		TargetID:    "",
		Incremental: false,
	}

	//Target ID - Scan ID
	targetIdScanIdMap = make(map[string]string)
	//Target ID - Scan Model
	scansJsonMap = make(map[string]models.ScanJSONModel)
)

type AssetService struct{}

// Fetches Target data from the Acunetix server.
func (a *AssetService) GetAllTargetsAcunetix() (map[string]string, error) {
	assetUrlTargetIdMap := make(map[string]string)
	// Define initial cursor as empty string
	cursor := ""

	for {
		// Build URL with cursor parameter
		endpoint := "/api/v1/targets?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

		// Send the request
		resp, err := utils.SendGETRequestAcunetix(endpoint)
		if err != nil {
			logger.Log.Errorln("Request error:", err)
			return nil, err
		}
		defer resp.Body.Close()

		// Read the response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Log.Errorln("Error reading response body:", err)
			return nil, err
		}

		// Parse JSON response
		var response models.Response
		err = json.Unmarshal(body, &response)
		if err != nil {
			logger.Log.Errorln("Error unmarshalling response:", err)
			return nil, err
		}

		// Append targets to allTargets slice and save to database
		for _, target := range response.Targets {
			assetUrlTargetIdMap[target.Address] = target.TargetID

			scanModel := models.Scan{
				TargetURL: target.Address,
				Scanner:   "Acunetix",
			}

			// Veritabanına kaydet
			if err := DB.Create(&scanModel).Error; err != nil {
				logger.Log.Errorln("Veritabanına hedef kaydetme hatası:", err)
				return nil, err
			}
		}

		// Check if there are more pages
		if len(response.Pagination.Cursors) > 1 {
			// Set the cursor for the next page
			cursor = response.Pagination.Cursors[1]
		} else {
			// No more pages, break out of the loop
			break
		}
	}

	return assetUrlTargetIdMap, nil
}

func AddAcunetixTarget(targetURL string) {
	target := models.Target{
		Address:     targetURL,
		Description: "",
		Type:        "default",
		Criticality: 10,
	}

	targetJSON, err := json.Marshal(target)
	if err != nil {
		fmt.Println("JSON encoding error:", err)
		return
	}

	responseAddTarget, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets", targetJSON)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer responseAddTarget.Body.Close()

	if responseAddTarget.StatusCode != 201 {
		fmt.Println("Response Status:", responseAddTarget.Status)
		logger.Log.Infoln("Hedef eklenemedi:", targetURL)
	}

}

/*
// GET https://127.0.0.1:3443/api/v1/scans
// Bütün taranmış bilgileri çekmek için. Taranmamışların bilgisi gelmiyor.
*/
func GetAllAcunetixScan() {
	cursor := ""

	for {
		endpoint := "/api/v1/scans?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

		var allScans models.AllScans

		// Send the request
		resp, err := utils.SendGETRequestAcunetix(endpoint)
		if err != nil {
			fmt.Println(err.Error())

		}
		defer resp.Body.Close()

		// Read the response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Println(err.Error())

		}

		// Parse JSON response
		err = json.Unmarshal(body, &allScans)
		if err != nil {
			fmt.Println(err.Error())
		}

		for _, scan := range allScans.Scans {
			scanJson := models.ScanJSONModel{
				TargetID:  scan.TargetID,
				Status:    scan.CurrentSession.Status,
				Address:   scan.Target.Address,
				ScanID:    scan.ScanID,
				StartDate: scan.CurrentSession.StartDate,
			}
			scansJsonMap[scan.TargetID] = scanJson
			targetIdScanIdMap[scan.TargetID] = scan.ScanID
		}

		// Check if there are more pages
		if len(allScans.Pagination.Cursors) > 1 {
			// Set the cursor for the next page
			cursor = allScans.Pagination.Cursors[1]
		} else {
			// No more pages, break out of the loop
			break
		}
	}

	logger.Log.Debugln("Scans written to database.")
}

// Scan başlatma fonksiyonu
func TriggerAcunetixScan(targetID string) {
	triggerModel.TargetID = targetID

	triggerJSON, err := json.Marshal(triggerModel)
	if err != nil {
		fmt.Println("JSON encoding error:", err)
		return
	}

	// Send the trigger scan request
	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/scans", triggerJSON)
	if err != nil {
		fmt.Println(err.Error())

	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err.Error())

	}

	if resp.StatusCode == 201 {
		logger.Log.Infoln("Scan started successfully -- ", targetID)
	} else {
		logger.Log.Infoln("Trigger Scan Response Status:", resp.Status)
		logger.Log.Infoln("Scan couldn't be started", string(body))
	}
}

// Hedefin daha önce taranıp taranmadığını kontrol eder.
func IsScannedTargetAcunetix(targetID string) bool {
	for scansJSONMapTargetID, scanInfo := range scansJsonMap {
		if scansJSONMapTargetID == targetID && (scanInfo.Status == "completed" || scanInfo.Status == "aborted" || scanInfo.Status == "failed" || scanInfo.Status == "processing") {
			return true
		}
	}

	return false
}