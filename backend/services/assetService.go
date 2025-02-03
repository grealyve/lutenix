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
func (a *AssetService) GetAllAcunetixTargets() (map[string]string, error) {
	assetUrlTargetIdMap := make(map[string]string)
	cursor := ""

	for {
		endpoint := "/api/v1/targets?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

		resp, err := utils.SendGETRequestAcunetix(endpoint)
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
			assetUrlTargetIdMap[target.Address] = target.TargetID

			scanModel := models.Scan{
				TargetURL: target.Address,
				Scanner:   "acunetix",
				Status:    models.ScanStatusPending,
			}

			var existingScan models.Scan
			result := DB.Where("target_url = ? AND scanner = ?", target.Address, "acunetix").First(&existingScan)

			if result.Error == nil {
				DB.Model(&existingScan).Updates(map[string]interface{}{
					"status": scanModel.Status,
				})
			} else {
				if err := DB.Create(&scanModel).Error; err != nil {
					logger.Log.Errorln("Error saving scan:", err)
					return nil, err
				}
			}
		}

		if len(response.Pagination.Cursors) > 1 {
			cursor = response.Pagination.Cursors[1]
		} else {
			break
		}
	}

	return assetUrlTargetIdMap, nil
}

func (a *AssetService) AddAcunetixTarget(targetURL string) {
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
func (a *AssetService) GetAllAcunetixScan() error {
	cursor := ""

	for {
		endpoint := "/api/v1/scans?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

		var allScans models.AllScans
		resp, err := utils.SendGETRequestAcunetix(endpoint)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}

		err = json.Unmarshal(body, &allScans)
		if err != nil {
			return err
		}

		for _, scan := range allScans.Scans {
			
			scanModel := models.Scan{
				TargetURL: scan.Target.Address,
				Scanner:   "acunetix",
				Status:    scan.CurrentSession.Status,
			}

			var existingScan models.Scan
			result := DB.Where("target_url = ? AND scanner = ?", scan.Target.Address, "acunetix").First(&existingScan)

			if result.Error == nil {
				
				DB.Model(&existingScan).Updates(map[string]interface{}{
					"status": scanModel.Status,
				})
			} else {
				
				if err := DB.Create(&scanModel).Error; err != nil {
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
		}

		if len(allScans.Pagination.Cursors) > 1 {
			cursor = allScans.Pagination.Cursors[1]
		} else {
			break
		}
	}

	return nil
}

// Scan başlatma fonksiyonu
func (a *AssetService) TriggerAcunetixScan(targetID string) {
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
func (a *AssetService) IsScannedTargetAcunetix(targetID string) bool {
	var scan models.Scan
	err := DB.Where("target_id = ? AND scanner = ? AND status IN (?)",
		targetID,
		"acunetix",
		[]string{models.ScanStatusCompleted, models.ScanStatusProcessing}).
		First(&scan).Error
	return err == nil
}

func (a *AssetService) DeleteAcunetixTargets(targetIDList []string) {

	targetJSON, err := json.Marshal(models.DeleteTargets{TargetIDList: targetIDList})
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
	}

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets/delete", targetJSON)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("Error reading response body: %v", err)
	}

	if resp.StatusCode == 204 {
		logger.Log.Infoln("Targets deleted successfully")
	} else {
		logger.Log.Errorln("Response Body:", string(body))
	}

}

func (as *AssetService) GetAllTargetsAcunetix() (map[string]string, error) {
	notScannedTargets := make(map[string]string)
	assetUrlTargetIdMap := make(map[string]string)

	// Veritabanından tamamlanmış veya devam eden taramaları al
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
		return nil, fmt.Errorf("data couldn't fetch from database: %v", err)
	}

	scannedTargets := make(map[string]bool)
	for _, scan := range scans {
		scannedTargets[scan.TargetURL] = true
	}

	for url, targetID := range assetUrlTargetIdMap {
		if !scannedTargets[url] {
			notScannedTargets[url] = targetID
		}
	}

	return notScannedTargets, nil
}
