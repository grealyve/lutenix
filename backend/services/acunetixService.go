package services

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/utils"
	"gorm.io/gorm"
)

var (
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

// Fetches Target data from the Acunetix server.
func (a *AssetService) GetAllAcunetixTargets(userID uuid.UUID) (map[string]string, error) {
	logger.Log.Debugf("GetAllAcunetixTargets called for user ID: %s", userID) // Debug: Entry Point
	assetUrlTargetIdMap := make(map[string]string)
	cursor := ""

	for {
		endpoint := "/api/v1/targets?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}
		logger.Log.Debugf("Fetching Acunetix targets with endpoint: %s", endpoint)

		resp, err := utils.SendGETRequestAcunetix(endpoint, userID)
		if err != nil {
			logger.Log.Errorln("Request error:", err)
			return nil, err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Log.Errorln("Error reading response body:", err)
			return nil, err
		}

		var response models.Response
		err = json.Unmarshal(body, &response)
		if err != nil {
			logger.Log.Errorln("Error unmarshalling response:", err)
			return nil, err
		}

		for _, target := range response.Targets {
			logger.Log.Debugf("Acunetix target found: Address=%s, TargetID=%s", target.Address, target.TargetID)
			assetUrlTargetIdMap[target.Address] = target.TargetID

			scanModel := models.Scan{
				TargetURL: target.Address,
				Scanner:   "acunetix",
				Status:    models.ScanStatusPending,
			}

			var existingScan models.Scan
			result := DB.Where("target_url = ? AND scanner = ?", target.Address, "acunetix").First(&existingScan)

			if result.Error == nil {
				logger.Log.Debugf("Updating existing scan for target: %s", target.Address)
				DB.Model(&existingScan).Updates(map[string]interface{}{
					"status": scanModel.Status,
				})
			} else {
				logger.Log.Debugf("Creating new scan for target: %s", target.Address)
				if err := DB.Create(&scanModel).Error; err != nil {
					logger.Log.Errorln("Error saving scan:", err)
					return nil, err
				}
			}
		}

		if len(response.Pagination.Cursors) > 1 {
			cursor = response.Pagination.Cursors[1]
			logger.Log.Debugf("Next cursor for Acunetix targets: %s", cursor)
		} else {
			logger.Log.Debugln("No more Acunetix targets to fetch.")
			break
		}
	}

	logger.Log.Infof("Successfully fetched Acunetix targets for user ID: %s", userID)
	return assetUrlTargetIdMap, nil
}

func (a *AssetService) AddAcunetixTarget(targetURL string, userID uuid.UUID) {
	logger.Log.Debugf("AddAcunetixTarget called for target URL: %s, user ID: %s", targetURL, userID) // Debug: Entry Point

	target := models.Target{
		Address:     targetURL,
		Description: "",
		Type:        "default",
		Criticality: 10,
	}

	targetJSON, err := json.Marshal(target)
	if err != nil {
		logger.Log.Errorln("Json encoding error:", err)
		return
	}

	responseAddTarget, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets", targetJSON, userID)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer responseAddTarget.Body.Close()

	if responseAddTarget.StatusCode != 201 {
		logger.Log.Errorf("Failed to add Acunetix target. Status: %s, Target URL: %s", responseAddTarget.Status, targetURL)
	} else {
		logger.Log.Infof("Successfully added Acunetix target: %s", targetURL)
	}

}

func (a *AssetService) GetAllAcunetixScan(userID uuid.UUID) error {
	logger.Log.Debugf("GetAllAcunetixScan called for user ID: %s", userID) // Debug: Entry Point
	cursor := ""

	for {
		endpoint := "/api/v1/scans?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}
		logger.Log.Debugf("Fetching Acunetix scans with endpoint: %s", endpoint)

		var allScans models.AllScans
		resp, err := utils.SendGETRequestAcunetix(endpoint, userID)
		if err != nil {
			logger.Log.Errorln("Error fetching Acunetix scans:", err)
			return err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Log.Errorln("Error reading Acunetix scan response body:", err)
			return err
		}

		err = json.Unmarshal(body, &allScans)
		if err != nil {
			logger.Log.Errorln("Error unmarshalling Acunetix scan response:", err)
			return err
		}

		for _, scan := range allScans.Scans {
			logger.Log.Debugf("Acunetix scan found: Target Address=%s, ScanID=%s, Status=%s", scan.Target.Address, scan.ScanID, scan.CurrentSession.Status)

			scanModel := models.Scan{
				TargetURL: scan.Target.Address,
				Scanner:   "acunetix",
				Status:    scan.CurrentSession.Status,
			}

			var existingScan models.Scan
			result := DB.Where("target_url = ? AND scanner = ?", scan.Target.Address, "acunetix").First(&existingScan)

			if result.Error == nil {
				logger.Log.Debugf("Updating existing scan status for target: %s", scan.Target.Address)
				DB.Model(&existingScan).Updates(map[string]interface{}{
					"status": scanModel.Status,
				})
			} else {
				logger.Log.Debugf("Creating new scan entry for target: %s", scan.Target.Address)
				if err := DB.Create(&scanModel).Error; err != nil {
					logger.Log.Errorln("Error saving scan to database:", err)
					return err
				}
			}

			scansJsonMap[scan.TargetID] = models.ScanJSONModel{
				TargetID:  scan.TargetID,
				Status:    scan.CurrentSession.Status,
				Address:   scan.Target.Address,
				ScanID:    scan.ScanID,
				StartDate: scan.CurrentSession.StartDate,
			}
			targetIdScanIdMap[scan.TargetID] = scan.ScanID
			logger.Log.Debugf("Mapping TargetID %s to ScanID %s", scan.TargetID, scan.ScanID)
		}

		if len(allScans.Pagination.Cursors) > 1 {
			cursor = allScans.Pagination.Cursors[1]
			logger.Log.Debugf("Next cursor for Acunetix scans: %s", cursor)
		} else {
			logger.Log.Debugln("No more Acunetix scans to fetch.")
			break
		}
	}
	logger.Log.Infof("Successfully fetched Acunetix scan data for user ID: %s", userID)
	return nil
}

// Scan başlatma fonksiyonu
func (a *AssetService) TriggerAcunetixScan(targetID string, userID uuid.UUID) {
	logger.Log.Debugf("TriggerAcunetixScan called for target ID: %s, user ID: %s", targetID, userID) // Debug: Entry Point
	triggerModel.TargetID = targetID

	triggerJSON, err := json.Marshal(triggerModel)
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
		return
	}

	// Send the trigger scan request
	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/scans", triggerJSON, userID)
	if err != nil {
		logger.Log.Errorln("Error triggering Acunetix scan:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorln("Error reading response body:", err)
		return
	}

	if resp.StatusCode == 201 {
		logger.Log.Infof("Scan started successfully for target ID: %s", targetID)
	} else {
		logger.Log.Errorf("Trigger Scan Response Status: %s, Body: %s", resp.Status, string(body))
	}
}

// Hedefin daha önce taranıp taranmadığını kontrol eder.
func (a *AssetService) IsScannedTargetAcunetix(targetID string, userID uuid.UUID) bool {
	logger.Log.Debugf("IsScannedTargetAcunetix called for target ID: %s, user ID: %s", targetID, userID)
	var scan models.Scan
	err := DB.Where("target_id = ? AND scanner = ? AND status IN (?)",
		targetID,
		"acunetix",
		[]string{models.ScanStatusCompleted, models.ScanStatusProcessing}).
		First(&scan).Error

	if err == nil {
		logger.Log.Infof("Target ID %s has been scanned before.", targetID)
		return true
	} else if err == gorm.ErrRecordNotFound {
		logger.Log.Infof("Target ID %s has not been scanned before.", targetID)
		return false
	} else {
		logger.Log.Errorf("Error checking if target %s is scanned: %v", targetID, err)
		return false
	}
}

func (a *AssetService) DeleteAcunetixTargets(targetIDList []string, userID uuid.UUID) {
	logger.Log.Debugf("DeleteAcunetixTargets called for targets: %v, user ID: %s", targetIDList, userID)

	targetJSON, err := json.Marshal(models.DeleteTargets{TargetIDList: targetIDList})
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
		return
	}

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets/delete", targetJSON, userID)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("Error reading response body: %v", err)
		return
	}

	if resp.StatusCode == 204 {
		logger.Log.Infoln("Targets deleted successfully")
	} else {
		logger.Log.Errorf("Failed to delete Acunetix targets.  Status: %s, Response Body: %s", resp.Status, string(body))
	}

}

func (as *AssetService) GetAllTargetsAcunetix(userID uuid.UUID) (map[string]string, error) {
	logger.Log.Debugln("GetAllTargetsAcunetix called")
	notScannedTargets := make(map[string]string)
	assetUrlTargetIdMap := make(map[string]string) // Bu map'in doldurulması gerekiyor.

	// Hata: assetUrlTargetIdMap boş olduğu için notScannedTargets her zaman boş dönecektir.
	// Bu fonksiyonun doğru çalışması için assetUrlTargetIdMap'in GetAllAcunetixTargets gibi bir yerden doldurulması gerekir.

	var scans []models.Scan
	if err := DB.Where(
		"scanner = ? AND status IN (?)",
		"acunetix",
		[]string{
			models.ScanStatusCompleted,
			models.ScanStatusProcessing,
			models.ScanStatusPending,
		},
	).Find(&scans).Error; err != nil {
		logger.Log.Errorln("Error fetching scans from database:", err)
		return nil, fmt.Errorf("data couldn't fetch from database: %v", err)
	}
	logger.Log.Debugf("Fetched %d scans from database", len(scans))

	scannedTargets := make(map[string]bool)
	for _, scan := range scans {
		logger.Log.Debugf("Marking target URL %s as scanned", scan.TargetURL)
		scannedTargets[scan.TargetURL] = true
	}

	for url, targetID := range assetUrlTargetIdMap {
		if !scannedTargets[url] {
			logger.Log.Debugf("Target URL %s (ID: %s) is not scanned", url, targetID)
			notScannedTargets[url] = targetID
		}
	}
	logger.Log.Infof("Found %d unscanned Acunetix targets", len(notScannedTargets))
	return notScannedTargets, nil
}