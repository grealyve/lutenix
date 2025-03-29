package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
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

// ZapAlertDetail mirrors the structure of a single alert from the ZAP /core/view/alerts endpoint
type ZapAlertDetail struct {
	SourceID    string            `json:"sourceid"`
	Other       string            `json:"other"`
	Method      string            `json:"method"`
	Evidence    string            `json:"evidence"`
	PluginID    string            `json:"pluginId"`
	CWEID       string            `json:"cweid"`
	Confidence  string            `json:"confidence"`
	WASCID      string            `json:"wascid"`
	Description string            `json:"description"`
	MessageID   string            `json:"messageId"`
	URL         string            `json:"url"`
	Reference   string            `json:"reference"`
	Solution    string            `json:"solution"`
	Alert       string            `json:"alert"` // Bu genellikle başlık oluyor
	Param       string            `json:"param"`
	Attack      string            `json:"attack"`
	Name        string            `json:"name"` // Alert ile aynı olabilir, kontrol etmek lazım
	Risk        string            `json:"risk"` // e.g., "High", "Medium", "Low", "Informational"
	ID          string            `json:"id"`   // ZAP internal alert ID
	AlertRef    string            `json:"alertRef"`
	Tags        map[string]string `json:"tags"` // Ekstra bilgi için
}

// ZapAlertsResponse mirrors the top-level structure of the ZAP /core/view/alerts response
type ZapAlertsResponse struct {
	Alerts []ZapAlertDetail `json:"alerts"`
}

type AssetService struct{}

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

/*
// GET https://127.0.0.1:3443/api/v1/scans
// Bütün taranmış bilgileri çekmek için. Taranmamışların bilgisi gelmiyor.
*/
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
		return // Return here; the scan likely didn't even start.
	}

	if resp.StatusCode == 201 {
		logger.Log.Infof("Scan started successfully for target ID: %s", targetID)
	} else {
		logger.Log.Errorf("Trigger Scan Response Status: %s, Body: %s", resp.Status, string(body))
	}
}

// Hedefin daha önce taranıp taranmadığını kontrol eder.
func (a *AssetService) IsScannedTargetAcunetix(targetID string, userID uuid.UUID) bool {
	logger.Log.Debugf("IsScannedTargetAcunetix called for target ID: %s, user ID: %s", targetID, userID) // Debug: Entry Point
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
		return false // Treat errors as not scanned, to be safe.
	}
}

func (a *AssetService) DeleteAcunetixTargets(targetIDList []string, userID uuid.UUID) {
	logger.Log.Debugf("DeleteAcunetixTargets called for targets: %v, user ID: %s", targetIDList, userID)

	targetJSON, err := json.Marshal(models.DeleteTargets{TargetIDList: targetIDList})
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
		return //Critical, unable to create request
	}

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets/delete", targetJSON, userID)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return // Critical, request failed.
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("Error reading response body: %v", err)
		return // We got a response, but couldn't read it.
	}

	if resp.StatusCode == 204 {
		logger.Log.Infoln("Targets deleted successfully")
	} else {
		logger.Log.Errorf("Failed to delete Acunetix targets.  Status: %s, Response Body: %s", resp.Status, string(body))
	}

}

func (as *AssetService) GetAllTargetsAcunetix() (map[string]string, error) {
	logger.Log.Debugln("GetAllTargetsAcunetix called") // Debug: Entry Point
	notScannedTargets := make(map[string]string)
	assetUrlTargetIdMap := make(map[string]string)

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

// Helper function: Get ZAP scanner settings for the user
func (a *AssetService) getUserScannerZAPSettings(userID uuid.UUID) (*models.ScannerSetting, error) {
	logger.Log.Debugf("getUserScannerZAPSettings called for user ID: %s", userID) // Debug: Entry Point
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		logger.Log.Errorf("User not found for ID %s: %v", userID, err)
		return nil, fmt.Errorf("user couldn't find: %v", err)
	}

	var scannerSetting models.ScannerSetting
	if err := database.DB.Where("company_id = ? AND scanner = ?", user.CompanyID, "zap").First(&scannerSetting).Error; err != nil {
		logger.Log.Errorf("Scanner settings (ZAP) not found for company ID %s: %v", user.CompanyID, err)
		return nil, fmt.Errorf("scanner settings couldn't find: %v", err)
	}

	logger.Log.Debugf("Retrieved ZAP scanner settings for user ID: %s", userID)
	return &scannerSetting, nil
}

/*
Add the URL to ZAP spider and start the scan.
http://localhost:8081/JSON/spider/action/scan/?apikey=6f1ebonoa9980csb8ls2895rl0&url=https%3A%2F%2Fwww.abdiibrahim.com&maxChildren=&recurse=1&contextName=&subtreeOnly=
*/
func (a *AssetService) AddZapSpiderURL(url string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("AddZapSpiderURL called for URL: %s, user ID: %s", url, userID) // Debug: Entry Point

	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err // Already logged in getUserScannerZAPSettings
	}

	endpoint := fmt.Sprintf("/JSON/spider/action/scan/?apikey=%s&url=%s&maxChildren=&recurse=1&contextName=&subtreeOnly=",
		scannerSetting.APIKey,
		url)

	logger.Log.Debugf("Sending ZAP spider request to: %s", endpoint)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error sending ZAP spider request:", err)
		return "", fmt.Errorf("spider scan couldn't start: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Scan string `json:"scan"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP spider response:", err)
		return "", fmt.Errorf("spider response couldn't handle: %v", err)
	}

	logger.Log.Infof("ZAP spider scan started. Scan ID: %s", result.Scan)
	return result.Scan, nil
}

/*
Start scan vulnerability scan
http://localhost:8081/JSON/ascan/action/scan/?apikey=6f1ebonoa9980csb8ls2895rl0&url=https%3A%2F%2Fwww.abdiibrahim.com&recurse=1&inScopeOnly=&scanPolicyName=&method=&postData=&contextId=
*/
func (a *AssetService) AddZapScanURL(url string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("AddZapScanURL called for URL: %s, user ID: %s", url, userID) // Debug: Entry Point
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err // Already logged in getUserScannerZAPSettings
	}

	endpoint := fmt.Sprintf("/JSON/ascan/action/scan/?apikey=%s&url=%s&recurse=1&inScopeOnly=&scanPolicyName=&method=&postData=&contextId=",
		scannerSetting.APIKey,
		url)

	logger.Log.Debugf("Sending ZAP active scan request to: %s", endpoint)
	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error sending ZAP active scan request:", err)
		return "", fmt.Errorf("vulnerability scan couldn't start: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Scan string `json:"scan"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP active scan response:", err)
		return "", fmt.Errorf("scan response couldn't handle: %v", err)
	}

	logger.Log.Infof("ZAP active scan started. Scan ID: %s", result.Scan)
	return result.Scan, nil
}

/*
Get the scan status
http://localhost:8081/JSON/ascan/view/status/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=2
*/
func (a *AssetService) GetZapScanStatus(scanID string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("GetZapScanStatus called for scan ID: %s, user ID: %s", scanID, userID) // Debug: Entry point
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err // Already logged
	}

	endpoint := fmt.Sprintf("/JSON/ascan/view/status/?apikey=%s&scanId=%s", scannerSetting.APIKey, scanID)
	logger.Log.Debugf("Checking ZAP scan status at: %s", endpoint)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error getting ZAP scan status:", err)
		return "", fmt.Errorf("scan status couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP scan status response:", err)
		return "", fmt.Errorf("status response couldn't handle: %v", err)
	}
	logger.Log.Infof("ZAP scan status for scan ID %s: %s", scanID, result.Status)
	return result.Status, nil
}

/*
Alarm numbers by scanid
http://localhost:8081/JSON/ascan/view/alertsIds/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=1
*/
func (a *AssetService) GetZapAlerts(scanID string, userID uuid.UUID) ([]string, error) {
	logger.Log.Debugf("GetZapAlerts called for scan ID: %s, user ID: %s", scanID, userID) // Debug: Entry Point

	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return nil, err // Already logged
	}

	endpoint := fmt.Sprintf("/JSON/ascan/view/alertsIds/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	logger.Log.Debugf("Fetching ZAP alert IDs from: %s", endpoint)
	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error fetching ZAP alert IDs:", err)
		return nil, fmt.Errorf("alerts couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		AlertsIds []string `json:"alertsIds"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP alert IDs response:", err)
		return nil, fmt.Errorf("alerts response couldn't handle: %v", err)
	}

	logger.Log.Infof("Found %d alert IDs for ZAP scan ID %s", len(result.AlertsIds), scanID)
	return result.AlertsIds, nil
}

/*
Get the scan result
Alarm detaylarını ID'ye göre çekme
http://localhost:8081/JSON/alert/view/alert/?apikey=6f1ebonoa9980csb8ls2895rl0&id=86
*/

func (a *AssetService) GetZapAlertDetail(alertID string, userID uuid.UUID) (models.Finding, error) {
	logger.Log.Debugf("GetZapAlertDetail called for alert ID: %s, user ID: %s", alertID, userID) // Debug: Entry point
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return models.Finding{}, err // Already logged
	}

	endpoint := fmt.Sprintf("/JSON/alert/view/alert/?apikey=%s&id=%s",
		scannerSetting.APIKey,
		alertID)

	logger.Log.Debugf("Fetching ZAP alert detail from: %s", endpoint)
	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error fetching ZAP alert detail:", err)
		return models.Finding{}, fmt.Errorf("alert detail couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Alert struct {
			URL         string `json:"url"`
			Risk        string `json:"risk"`
			Name        string `json:"name"`
			Evidence    string `json:"evidence"`
			Severity    string `json:"severity"` // Added Severity
			CWE         string `json:"cweid"`
			Description string `json:"description"`
		} `json:"alert"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP alert detail response:", err)
		return models.Finding{}, fmt.Errorf("alert detail response couldn't handle: %v", err)
	}

	finding := models.Finding{
		URL:               result.Alert.URL,
		Risk:              result.Alert.Risk,
		VulnerabilityName: result.Alert.Name,
		Location:          result.Alert.CWE,
	}
	logger.Log.Infof("Retrieved ZAP alert detail for alert ID %s: %+v", alertID, finding) // Log the finding details
	return finding, nil
}

/*
Remove scan
http://localhost:8081/JSON/spider/action/removeScan/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=0
*/
func (a *AssetService) RemoveZapScan(scanID string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("RemoveZapScan called for scan ID: %s, user ID: %s", scanID, userID) // Debug: Entry Point
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err // Already logged
	}

	endpoint := fmt.Sprintf("/JSON/spider/action/removeScan/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	logger.Log.Debugf("Sending ZAP scan removal request to: %s", endpoint)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error sending ZAP scan removal request:", err)
		return "", fmt.Errorf("scan couldn't be deleted: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Result string `json:"Result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP scan removal response:", err)
		return "", fmt.Errorf("deletion response couldn't handle: %v", err)
	}

	logger.Log.Infof("ZAP scan removal result for scan ID %s: %s", scanID, result.Result)
	return result.Result, nil
}

/*
Pause Scan
http://localhost:8081/JSON/ascan/action/pause/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=2
*/
func (a *AssetService) PauseZapScan(scanID string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("PauseZapScan called for scan ID: %s, user ID: %s", scanID, userID) // Debug: Entry Point
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err
	}

	endpoint := fmt.Sprintf("/JSON/ascan/action/pause/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	logger.Log.Debugf("Sending ZAP scan pause request to: %s", endpoint)
	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error sending ZAP scan pause request:", err)
		return "", fmt.Errorf("scan couldn't stopped: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Result string `json:"Result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP scan pause response:", err)
		return "", fmt.Errorf("stopping response couldn't handle: %v", err)
	}
	logger.Log.Infof("ZAP scan pause result for scan ID %s: %s", scanID, result.Result)

	return result.Result, nil
}

// Both spider and vulnerability scan
func (a *AssetService) StartZAPScan(url string, userID uuid.UUID) (*models.Scan, error) {
	logger.Log.Debugf("StartZAPScan called for URL: %s, user ID: %s", url, userID) // Debug: Entry Point
	// Get user info
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		logger.Log.Errorf("User not found for ID %s: %v", userID, err)
		return nil, fmt.Errorf("user not found: %v", err)
	}

	// Create new scan record
	scan := &models.Scan{
		CompanyID: user.CompanyID,
		CreatedBy: userID,
		Scanner:   "zap",
		TargetURL: url,
		Status:    models.ScanStatusProcessing,
	}

	if err := database.DB.Create(scan).Error; err != nil {
		logger.Log.Errorln("Error creating scan record:", err)
		return nil, fmt.Errorf("couldn't create scan record: %v", err)
	}
	logger.Log.Infof("Created scan record for URL: %s, Scan ID: %s", url, scan.ID)

	// Start spider scan
	spiderScanID, err := a.AddZapSpiderURL(url, userID)
	if err != nil {
		scan.Status = models.ScanStatusFailed
		database.DB.Save(scan)
		logger.Log.Errorf("Failed to start ZAP spider scan for URL: %s, Scan ID: %s", url, scan.ID)
		return nil, err // Already logged
	}
	logger.Log.Infof("Started ZAP spider scan for URL: %s, Spider Scan ID: %s", url, spiderScanID)

	// Wait for spider scan to complete
	for {
		status, err := a.GetZapSpiderStatus(spiderScanID, userID)
		if err != nil {
			scan.Status = models.ScanStatusFailed
			database.DB.Save(scan)
			logger.Log.Errorf("Failed to get ZAP spider status for URL: %s, Scan ID: %s", url, scan.ID)
			return nil, err // Already logged
		}
		logger.Log.Debugf("ZAP spider scan status for URL: %s, Scan ID: %s, Status: %s", url, scan.ID, status)

		if status == "100" {
			logger.Log.Infof("ZAP spider scan completed for URL: %s, Scan ID: %s", url, scan.ID)
			break
		}
		logger.Log.Debugf("Waiting for ZAP spider scan to complete.  Sleeping for 5 seconds...")
		time.Sleep(5 * time.Second)
	}

	// Start vulnerability scan
	vulnScanID, err := a.AddZapScanURL(url, userID)
	if err != nil {
		scan.Status = models.ScanStatusFailed
		database.DB.Save(scan)
		logger.Log.Errorf("Failed to start ZAP vulnerability scan for URL: %s, Scan ID: %s", url, scan.ID)
		return nil, err // Already logged
	}
	logger.Log.Infof("Started ZAP vulnerability scan for URL: %s, Vulnerability Scan ID: %s", url, vulnScanID)

	// Store scan IDs in database
	scan.ZapSpiderScanID = spiderScanID
	scan.ZapVulnScanID = vulnScanID
	if err := database.DB.Save(scan).Error; err != nil {
		logger.Log.Errorf("Error updating scan record with scan IDs for URL: %s, Scan ID: %s", url, scan.ID)
		return nil, fmt.Errorf("couldn't update scan record: %v", err)
	}
	logger.Log.Infof("Updated scan record with ZAP scan IDs for URL: %s, Scan ID: %s", url, scan.ID)

	return scan, nil
}

// GetZapSpiderStatus gets the status of a ZAP spider scan
func (a *AssetService) GetZapSpiderStatus(spiderScanID string, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("GetZapSpiderStatus called for spider scan ID: %s, user ID: %s", spiderScanID, userID)

	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", err
	}

	endpoint := fmt.Sprintf("/JSON/spider/view/status/?apikey=%s&scanId=%s", scannerSetting.APIKey, spiderScanID)
	logger.Log.Debugf("Checking ZAP spider status at: %s", endpoint)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		logger.Log.Errorln("Error getting ZAP spider scan status:", err)
		return "", fmt.Errorf("spider status couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Log.Errorln("Error decoding ZAP spider status response:", err)
		return "", fmt.Errorf("status response couldn't handle: %v", err)
	}

	logger.Log.Infof("ZAP spider scan status for scan ID %s: %s", spiderScanID, result.Status)
	return result.Status, nil
}

// CheckScanStatus checks the current status of a scan
func (a *AssetService) CheckZAPScanStatus(scanID uuid.UUID, userID uuid.UUID) (string, error) {
	logger.Log.Debugf("CheckZAPScanStatus called for scan ID: %s, user ID: %s", scanID, userID)
	var scan models.Scan
	
	if err := database.DB.First(&scan, "id = ?", scanID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) { return "", fmt.Errorf("scan not found") }
		logger.Log.Errorf("Error fetching scan %s: %v", scanID, err)
		return "", fmt.Errorf("database error finding scan: %v", err)
	}

	if scan.Status == models.ScanStatusCompleted || scan.Status == models.ScanStatusFailed {
		logger.Log.Infof("Scan %s already in terminal state: %s. No action needed.", scanID, scan.Status)
		return scan.Status, nil
	}

	if scan.Status != models.ScanStatusProcessing {
		logger.Log.Warnf("Scan %s is in unexpected state '%s'. Returning current status.", scanID, scan.Status)
		return scan.Status, nil
	}

	if scan.ZapVulnScanID == "" {
		logger.Log.Errorf("Scan %s is processing but has no ZapVulnScanID. Failing scan.", scanID)
		scan.Status = models.ScanStatusFailed
		if err := database.DB.Save(&scan).Error; err != nil {
			logger.Log.Errorf("Failed to save scan %s status to Failed (missing ZapID): %v", scanID, err)
			return models.ScanStatusFailed, fmt.Errorf("missing ZAP scan ID and failed to update status: %v", err)
		}
		return models.ScanStatusFailed, fmt.Errorf("missing ZAP vulnerability scan ID")
	}

	zapStatus, err := a.GetZapScanStatus(scan.ZapVulnScanID, userID)
	if err != nil {
		logger.Log.Errorf("Error checking ZAP active scan status for scan %s (ZAP ID: %s): %v", scan.ID, scan.ZapVulnScanID, err)
		return scan.Status, err 
	}
	logger.Log.Infof("ZAP active scan status for DB scan ID %s (ZAP ID %s): %s", scan.ID, scan.ZapVulnScanID, zapStatus)

	if zapStatus == "100" && scan.Status == models.ScanStatusProcessing {
		logger.Log.Infof("ZAP active scan completed for scan ID %s and DB status is Processing. Fetching and saving results...", scan.ID)

		savedFindings, processErr := a.FetchAndSaveZapFindingsByURL(scan.TargetURL, userID)
		if processErr != nil {
			logger.Log.Errorf("Error fetching/saving results for scan ID %s: %v. Failing scan.", scan.ID, processErr)
			scan.Status = models.ScanStatusFailed
			scan.VulnerabilityCount = 0
			if err := database.DB.Save(&scan).Error; err != nil {
				logger.Log.Errorf("Failed to save scan %s status to Failed after processing error: %v", scanID, err)
				return models.ScanStatusFailed, fmt.Errorf("processing error (%v) and failed to update status (%v)", processErr, err)
			}
			return models.ScanStatusFailed, processErr
		}

		logger.Log.Infof("Successfully processed results for scan %s. Updating status to Completed.", scan.ID)
		scan.Status = models.ScanStatusCompleted
		scan.VulnerabilityCount = len(savedFindings)
		logger.Log.Debugf("Attempting to save Scan %s with Status: %s, VulnCount: %d", scan.ID, scan.Status, scan.VulnerabilityCount)
		if err := database.DB.Save(&scan).Error; err != nil {
			logger.Log.Errorf("CRITICAL: Findings saved for scan %s, but FAILED to update scan status/count to Completed: %v", scan.ID, err)
			return models.ScanStatusCompleted, fmt.Errorf("findings saved, but failed to update scan status: %v", err)
		}
		logger.Log.Infof("Successfully updated scan %s status to %s with %d vulnerabilities.", scan.ID, scan.Status, scan.VulnerabilityCount)

	} else if zapStatus != "100" {
		logger.Log.Debugf("ZAP scan %s (ZAP ID %s) is still running (%s%%). DB status (%s) remains unchanged.", scan.ID, scan.ZapVulnScanID, zapStatus, scan.Status)
	} else {
		logger.Log.Debugf("ZAP scan %s (ZAP ID %s) is at 100%%, but DB status is already '%s'. No action needed.", scan.ID, scan.ZapVulnScanID, scan.Status)
	}

	return scan.Status, nil
}

/*
	func (a *AssetService) GetZapAlertsByURLFromZAP(baseURL string, userID uuid.UUID) ([]ZapAlertDetail, error) {
		logger.Log.Debugf("getZapAlertsByURLFromZAP called for baseURL: %s, user ID: %s", baseURL, userID)

		scannerSetting, err := a.getUserScannerZAPSettings(userID)
		if err != nil {
			return nil, err
		}

		encodedBaseURL := url.QueryEscape(baseURL)

		endpoint := fmt.Sprintf("/JSON/core/view/alerts/?apikey=%s&baseurl=%s&start=&count=",
			scannerSetting.APIKey,
			encodedBaseURL,
		)

		logger.Log.Debugf("Fetching ZAP alerts from: %s", endpoint)
		resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
		if err != nil {
			logger.Log.Errorf("Error fetching ZAP alerts for base URL %s: %v", baseURL, err)
			return nil, fmt.Errorf("alerts couldn't be fetched from ZAP: %v", err)
		}
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			logger.Log.Errorf("Error reading ZAP alerts response body for base URL %s: %v", baseURL, err)
			return nil, fmt.Errorf("failed to read alerts response body: %v", err)
		}

		if resp.StatusCode != http.StatusOK {
			logger.Log.Errorf("ZAP get alerts by URL request failed for base URL %s with status %d: %s", baseURL, resp.StatusCode, string(bodyBytes))
			return nil, fmt.Errorf("ZAP get alerts API returned non-OK status: %d", resp.StatusCode)
		}

		var result ZapAlertsResponse
		if err := json.Unmarshal(bodyBytes, &result); err != nil {
			logger.Log.Errorf("Error decoding ZAP alerts response for base URL %s: %v. Body: %s", baseURL, err, string(bodyBytes))
			return nil, fmt.Errorf("alerts response couldn't be handled: %v", err)
		}

		logger.Log.Infof("Successfully fetched %d alerts from ZAP for base URL: %s", len(result.Alerts), baseURL)
		return result.Alerts, nil
	}
*/

// FetchAndSaveZapFindingsByURL fetches ZAP findings for a given URL and saves them to the database
func (a *AssetService) FetchAndSaveZapFindingsByURL(baseURL string, userID uuid.UUID) ([]models.Finding, error) {
	logger.Log.Debugf("FetchAndSaveZapFindingsByURL called for baseURL: %s, user ID: %s", baseURL, userID)

	var user models.User
	if err := database.DB.Select("company_id").First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) { return nil, fmt.Errorf("user not found") }
		logger.Log.Errorf("Error fetching user %s: %v", userID, err)
		return nil, fmt.Errorf("could not retrieve user information: %v", err)
	}

	var latestScan models.Scan
	err := database.DB.Where("company_id = ? AND target_url = ? AND scanner = ?",
		user.CompanyID, baseURL, "zap",
	).Order("created_at DESC").First(&latestScan).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("no scan record found for the specified URL in the database")
		}
		logger.Log.Errorf("Error finding latest scan for URL %s, company %s: %v", baseURL, user.CompanyID, err)
		return nil, fmt.Errorf("database error finding scan record: %v", err)
	}
	logger.Log.Infof("Found associated scan record ID: %s for URL: %s", latestScan.ID, baseURL)

	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil { return nil, err }
	encodedBaseURL := url.QueryEscape(baseURL)
	endpoint := fmt.Sprintf("/JSON/core/view/alerts/?apikey=%s&baseurl=%s&start=&count=",
		scannerSetting.APIKey, encodedBaseURL)

	logger.Log.Debugf("Fetching ZAP alerts from: %s", endpoint)
	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil { return nil, fmt.Errorf("alerts couldn't be fetched from ZAP: %v", err) }
	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil { return nil, fmt.Errorf("failed to read alerts response body: %v", err) }
	if resp.StatusCode != http.StatusOK { return nil, fmt.Errorf("ZAP get alerts API returned non-OK status: %d", resp.StatusCode) }
	var zapResult ZapAlertsResponse
	if err := json.Unmarshal(bodyBytes, &zapResult); err != nil { return nil, fmt.Errorf("ZAP alerts response couldn't be handled: %v", err) }
	logger.Log.Infof("Successfully fetched %d alerts from ZAP for base URL: %s", len(zapResult.Alerts), baseURL)


	savedFindings := []models.Finding{}

	tx := database.DB.Begin()
	if tx.Error != nil {
		logger.Log.Errorf("Failed to begin transaction for scan %s: %v", latestScan.ID, tx.Error)
		return nil, fmt.Errorf("database transaction could not start: %v", tx.Error)
	}

	logger.Log.Debugf("Deleting existing findings for scan ID: %s", latestScan.ID)
	if err := tx.Where("scan_id = ?", latestScan.ID).Delete(&models.Finding{}).Error; err != nil {
		tx.Rollback() // Hata olursa işlemi geri al
		logger.Log.Errorf("Failed to delete existing findings for scan %s: %v", latestScan.ID, err)
		return nil, fmt.Errorf("failed to clear previous findings: %v", err)
	}
	logger.Log.Infof("Successfully deleted existing findings for scan %s", latestScan.ID)

	for _, zapAlert := range zapResult.Alerts {
		finding := models.Finding{
			ScanID:            latestScan.ID,
			URL:               zapAlert.URL,
			Risk:              zapAlert.Risk,
			VulnerabilityName: zapAlert.Alert,
			Location:          zapAlert.URL,
		}

		if err := tx.Create(&finding).Error; err != nil {
			tx.Rollback()
			logger.Log.Errorf("Error saving finding (Vuln: %s) within transaction for scan %s: %v", finding.VulnerabilityName, latestScan.ID, err)
			// Tek bir hata bile tüm işlemi başarısız kılar (Transaction mantığı)
			return nil, fmt.Errorf("failed to save finding '%s' during transaction: %v", finding.VulnerabilityName, err)
		}
		savedFindings = append(savedFindings, finding)
	}

	if err := tx.Commit().Error; err != nil {
		logger.Log.Errorf("Failed to commit transaction for scan %s: %v", latestScan.ID, err)
		return nil, fmt.Errorf("database transaction could not commit: %v", err)
	}

	logger.Log.Infof("Transaction committed. Processed %d ZAP alerts, saved %d findings for scan %s.", len(zapResult.Alerts), len(savedFindings), latestScan.ID)

	return savedFindings, nil
}

// Lists semgrep deployments
func (a *AssetService) SemgrepListDeployments(userID uuid.UUID) ([]models.SemgrepDeployment, error) {
	logger.Log.Debugf("SemgrepListDeployments called for user ID: %s", userID) // Debug: Entry Point

	resp, err := utils.SendGETRequestSemgrep("/api/v1/deployments", userID)
	if err != nil {
		logger.Log.Errorln("Error fetching Semgrep deployments:", err)
		return nil, fmt.Errorf("deployments couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Deployments []models.SemgrepDeployment `json:"deployments"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		logger.Log.Errorln("Error decoding Semgrep deployments response:", err)
		return nil, fmt.Errorf("deployment response couldn't handle: %v", err)
	}
	logger.Log.Infof("Retrieved %d Semgrep deployments for user ID: %s", len(response.Deployments), userID)

	return response.Deployments, nil
}

// Lists semgrep projects
func (a *AssetService) SemgrepListProjects(deploymentSlug string, userID uuid.UUID) ([]models.SemgrepProject, error) {
	logger.Log.Debugf("SemgrepListProjects called for deployment slug: %s, user ID: %s", deploymentSlug, userID) // Debug: Entry point
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/projects", deploymentSlug)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		logger.Log.Errorln("Error fetching Semgrep projects:", err)
		return nil, fmt.Errorf("projeler couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Projects []models.SemgrepProject `json:"projects"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		logger.Log.Errorln("Error decoding Semgrep projects response:", err)
		return nil, fmt.Errorf("project response couldn't handle: %v", err)
	}
	logger.Log.Infof("Retrieved %d Semgrep projects for deployment slug: %s", len(response.Projects), deploymentSlug)

	return response.Projects, nil
}

// Fetches scan details from the Semgrep server
func (a *AssetService) SemgrepGetScanDetails(deploymentID string, scanID int, userID uuid.UUID) (*models.SemgrepScan, error) {
	usr, err := utils.SemgrepGetUserSettings(userID)
	if err != nil {
		logger.Log.Errorln("Error fetching user settings:", err)
		return nil, fmt.Errorf("user settings couldn't fetch: %v", err)
	}

	logger.Log.Debugf("SemgrepGetScanDetails called for deployment ID: %s, scan ID: %d, user ID: %s, company ID: %s", deploymentID, scanID, userID, usr.CompanyID) // Debug: Entry point
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/scan/%d", deploymentID, scanID)

	// Basic validation: Ensure companyID is not the zero UUID
	if usr.CompanyID == uuid.Nil {
		logger.Log.Errorf("Attempted to save Semgrep scan with nil CompanyID for deployment %s, scan %d", deploymentID, scanID)
		return nil, fmt.Errorf("invalid company ID provided for saving scan")
	}

	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		logger.Log.Errorln("Error fetching Semgrep scan details:", err)
		return nil, fmt.Errorf("scan details couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var scan models.SemgrepScan
	if err := json.NewDecoder(resp.Body).Decode(&scan); err != nil {
		logger.Log.Errorln("Error decoding Semgrep scan details response:", err)
		return nil, fmt.Errorf("scan response couldn't handle: %v", err)
	}

	// Veritabanına kaydet
	dbScan := models.Scan{
		Scanner:            "semgrep",
		Status:             models.ScanStatusCompleted,
		TargetURL:          scan.Meta.RepoURL,
		VulnerabilityCount: scan.Stats.Findings,
		CompanyID:          usr.CompanyID,
		CreatedBy:          userID,
	}
	if err := database.DB.Create(&dbScan).Error; err != nil {
		logger.Log.Errorln("Error saving Semgrep scan to database:", err)
		return nil, fmt.Errorf("semgrep scan couldn't save: %w", err)
	}

	logger.Log.Infof("Retrieved and saved Semgrep scan details for deployment ID: %s, scan ID: %d, DB Scan ID: %s", deploymentID, scanID, dbScan.ID)

	return &scan, nil
}

// Lists semgrep scans
func (a *AssetService) SemgrepListScans(deploymentID string, user_id uuid.UUID) ([]models.SemgrepScan, error) {
	logger.Log.Debugf("SemgrepListScans called for deployment ID: %s, user ID: %s", deploymentID, user_id) // Debug Entry point.
	param := models.SemgrepScanSearchParams{}

	body, err := json.Marshal(param)
	if err != nil {
		logger.Log.Errorln("Error encoding Semgrep scan search parameters:", err)
		return nil, fmt.Errorf("scan search parameters couldn't encode: %v", err)
	}

	resp, err := utils.SendCustomRequestSemgrep("POST", "/api/v1/deployments/"+deploymentID+"/scans/search", body, user_id)
	if err != nil {
		logger.Log.Errorln("Error sending Semgrep scan search request:", err)
		return nil, fmt.Errorf("scan search parameters couldn't encode: %v", err) // Same error message as above, this seems correct.
	}
	defer resp.Body.Close()

	var response struct {
		Scans []models.SemgrepScan `json:"scans"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		logger.Log.Errorln("Error decoding Semgrep scan search response:", err)
		return nil, fmt.Errorf("scan response couldn't handle: %v", err)
	}
	logger.Log.Infof("Retrieved %d Semgrep scans for deployment ID: %s", len(response.Scans), deploymentID)
	return response.Scans, nil
}

// Lists semgrep findings
func (a *AssetService) SemgrepListFindings(deploymentSlug string, userID uuid.UUID) ([]models.Finding, error) {
	logger.Log.Debugf("SemgrepListFindings called for deployment slug: %s, user ID: %s", deploymentSlug, userID)

	var user models.User
	if err := database.DB.Select("company_id").First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Log.Errorf("User not found for ID: %s", userID)
			return nil, fmt.Errorf("user not found: %w", err)
		}
		logger.Log.Errorf("Error fetching user's company ID: %v", err)
		return nil, fmt.Errorf("failed to retrieve user details: %w", err)
	}
	if user.CompanyID == uuid.Nil {
		logger.Log.Errorf("User %s does not have a valid CompanyID associated.", userID)
		return nil, fmt.Errorf("user %s has no associated company", userID)
	}
	companyID := user.CompanyID
	logger.Log.Debugf("Found CompanyID: %s for UserID: %s", companyID, userID)

	endpoint := fmt.Sprintf("/api/v1/deployments/%s/findings", deploymentSlug)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		logger.Log.Errorln("Error fetching Semgrep findings initially:", err)
		return nil, fmt.Errorf("initial findings fetch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		logger.Log.Errorf("Semgrep API returned non-OK status %d during initial findings fetch. Body: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("semgrep API request failed with status %d", resp.StatusCode)
	}

	bodyBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		logger.Log.Errorf("Could not read response body from initial findings fetch: %v", readErr)
		return nil, fmt.Errorf("failed to read semgrep response body: %w", readErr)
	}

	var apiResponse struct {
		Findings []struct {
			Repository struct {
				URL string `json:"url"`
			} `json:"repository"`
			Severity string `json:"severity"`
			RuleName string `json:"rule_name"`
			Location struct {
				FilePath string `json:"file_path"`
				Line     int    `json:"line"`
			} `json:"location"`
		} `json:"findings"`
	}

	if err := json.Unmarshal(bodyBytes, &apiResponse); err != nil {
		logger.Log.Errorf("Error decoding Semgrep findings response: %v", err)
		logger.Log.Debugf("Raw Semgrep findings response body: %s", string(bodyBytes))
		return nil, fmt.Errorf("finding response couldn't handle: %w", err)
	}
	logger.Log.Debugf("Successfully decoded %d findings from Semgrep API for deployment: %s", len(apiResponse.Findings), deploymentSlug)

	var targetURLForScan string
	if len(apiResponse.Findings) > 0 && apiResponse.Findings[0].Repository.URL != "" {
		targetURLForScan = apiResponse.Findings[0].Repository.URL
		logger.Log.Debugf("Using Repository URL '%s' as TargetURL for Scan record.", targetURLForScan)
	} else {
		targetURLForScan = deploymentSlug
		logger.Log.Warnf("No findings returned or first finding lacks Repository URL. Using deploymentSlug '%s' as TargetURL for Scan record.", targetURLForScan)
	}

	scan := models.Scan{}

	queryConditions := models.Scan{
		CompanyID: companyID,
		Scanner:   "semgrep",
		TargetURL: targetURLForScan,
	}
	attrsToCreate := models.Scan{
		CreatedBy: userID,
	}
	assignAttrs := models.Scan{
		Status:         models.ScanStatusProcessing,
		DeploymentSlug: deploymentSlug,
	}

	err = database.DB.Where(queryConditions).
		Attrs(attrsToCreate).
		Assign(assignAttrs).
		FirstOrCreate(&scan).Error

	if err != nil {
		logger.Log.Errorf("Error finding or creating Scan record for TargetURL %s (derived from deployment %s): %v", targetURLForScan, deploymentSlug, err)
		if scan.ID != uuid.Nil {
			database.DB.Model(&scan).Update("Status", models.ScanStatusFailed)
		}
		return nil, fmt.Errorf("failed to prepare scan record: %w", err)
	}
	logger.Log.Infof("Using Scan record ID: %s for TargetURL: %s (DeploymentSlug: %s)", scan.ID, targetURLForScan, scan.DeploymentSlug)

	var savedFindings []models.Finding

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		logger.Log.Debugf("Deleting existing findings for ScanID: %s before inserting new ones.", scan.ID)
		if errDel := tx.Where("scan_id = ?", scan.ID).Delete(&models.Finding{}).Error; errDel != nil {
			logger.Log.Errorf("Failed to delete previous findings for ScanID %s: %v", scan.ID, errDel)
			return fmt.Errorf("failed to clear previous findings: %w", errDel)
		}

		if len(apiResponse.Findings) > 0 {
			logger.Log.Debugf("Inserting %d new findings for ScanID: %s", len(apiResponse.Findings), scan.ID)
			for _, f := range apiResponse.Findings {
				findingSeverity := f.Severity
				if findingSeverity == "" {
					logger.Log.Warnf("Semgrep finding (Rule: '%s', Path: '%s', ScanID: %s) has empty severity. Defaulting to 'UNKNOWN'.", f.RuleName, f.Location.FilePath, scan.ID)
					findingSeverity = "UNKNOWN"
				}

				if f.Repository.URL != targetURLForScan {
					logger.Log.Warnf("Finding's Repository URL ('%s') differs from Scan's TargetURL ('%s') for ScanID %s. Finding will still be associated.", f.Repository.URL, targetURLForScan, scan.ID)
				}

				if f.Repository.URL == "" || f.RuleName == "" {
					logger.Log.Warnf("Semgrep finding missing required data (URL or RuleName) for ScanID %s. Skipping.", scan.ID)
					continue
				}

				finding := models.Finding{
					ScanID:            scan.ID,
					URL:               f.Repository.URL,
					Risk:              findingSeverity,
					VulnerabilityName: f.RuleName,
					Location:          fmt.Sprintf("%s:%d", f.Location.FilePath, f.Location.Line),
				}

				// Create işlemi artık her zaman INSERT olacak çünkü eskiler silindi
				if err := tx.Create(&finding).Error; err != nil {
					logger.Log.Errorf("Error saving Semgrep finding within transaction (ScanID: %s): %v. Details: %+v", scan.ID, err, finding)
					return fmt.Errorf("semgrep finding couldn't save: %w", err)
				}
				savedFindings = append(savedFindings, finding)
			}
		} else {
			logger.Log.Debugf("No findings returned from API for ScanID: %s. Previous findings (if any) were deleted.", scan.ID)
		}

		updateData := map[string]interface{}{
			"status":              models.ScanStatusCompleted,
			"vulnerability_count": len(savedFindings),
		}
		logger.Log.Debugf("Updating Scan %s final status to %s and count to %d within transaction.", scan.ID, models.ScanStatusCompleted, len(savedFindings))
		if err := tx.Model(&models.Scan{}).Where("id = ?", scan.ID).Updates(updateData).Error; err != nil {
			logger.Log.Errorf("Error updating scan status/count for ScanID %s within transaction: %v", scan.ID, err)
			return fmt.Errorf("failed to finalize scan record %s: %w", scan.ID, err)
		}

		return nil
	})
	if err != nil {
		logger.Log.Errorf("Failed transaction while processing findings for ScanID %s: %v", scan.ID, err)
		database.DB.Model(&scan).Where("status != ?", models.ScanStatusFailed).Update("status", models.ScanStatusFailed)
		return nil, err
	}

	logger.Log.Infof("Successfully processed Semgrep findings for ScanID: %s, TargetURL: %s. Found/Saved %d findings.", scan.ID, targetURLForScan, len(savedFindings))
	return savedFindings, nil
}

// Lists semgrep secrets findings
func (a *AssetService) SemgrepListSecrets(deploymentID string, userID uuid.UUID) ([]models.Finding, error) {
	logger.Log.Debugf("SemgrepListSecrets called for deployment ID: %s, user ID: %s", deploymentID, userID) // Debug: Entry point
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/secrets", deploymentID)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		logger.Log.Errorln("Error fetching Semgrep secrets:", err)
		return nil, fmt.Errorf("secrets couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Findings []struct {
			ID          string `json:"id"`
			Type        string `json:"type"`
			FindingPath string `json:"findingPath"`
			Repository  struct {
				Name string `json:"name"`
				URL  string `json:"url"`
			} `json:"repository"`
			Severity   string `json:"severity"`
			Confidence string `json:"confidence"`
		} `json:"findings"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		logger.Log.Errorln("Error decoding Semgrep secrets response:", err)
		return nil, fmt.Errorf("secrets response couldn't handle: %v", err)
	}

	var findings []models.Finding
	for _, f := range response.Findings {
		finding := models.Finding{
			URL:               f.Repository.URL,
			Risk:              f.Severity,
			VulnerabilityName: fmt.Sprintf("Secret: %s", f.Type),
			Location:          f.FindingPath,
		}
		logger.Log.Debugf("Found Semgrep secret: %+v", finding)
		findings = append(findings, finding)
	}
	logger.Log.Infof("Retrieved %d Semgrep secrets for deployment ID: %s", len(findings), deploymentID)
	return findings, nil
}
