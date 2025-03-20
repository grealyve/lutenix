package services

import (
	"encoding/json"
	"fmt"
	"io"
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

type AssetService struct{}

// Fetches Target data from the Acunetix server.
func (a *AssetService) GetAllAcunetixTargets(userID uuid.UUID) (map[string]string, error) {
	assetUrlTargetIdMap := make(map[string]string)
	cursor := ""

	for {
		endpoint := "/api/v1/targets?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

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

func (a *AssetService) AddAcunetixTarget(targetURL string, userID uuid.UUID) {
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

	responseAddTarget, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets", targetJSON, userID)
	if err != nil {
		logger.Log.Errorln("Request error:", err)
		return
	}
	defer responseAddTarget.Body.Close()

	if responseAddTarget.StatusCode != 201 {
		fmt.Println("Response Status:", responseAddTarget.Status)
		logger.Log.Infoln("Targets couldn't be added:", targetURL)
	}

}

/*
// GET https://127.0.0.1:3443/api/v1/scans
// Bütün taranmış bilgileri çekmek için. Taranmamışların bilgisi gelmiyor.
*/
func (a *AssetService) GetAllAcunetixScan(userID uuid.UUID) error {
	cursor := ""

	for {
		endpoint := "/api/v1/scans?l=99"
		if cursor != "" {
			endpoint += "&c=" + cursor
		}

		var allScans models.AllScans
		resp, err := utils.SendGETRequestAcunetix(endpoint, userID)
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
func (a *AssetService) TriggerAcunetixScan(targetID string, userID uuid.UUID) {
	triggerModel.TargetID = targetID

	triggerJSON, err := json.Marshal(triggerModel)
	if err != nil {
		fmt.Println("JSON encoding error:", err)
		return
	}

	// Send the trigger scan request
	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/scans", triggerJSON, userID)
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
func (a *AssetService) IsScannedTargetAcunetix(targetID string, userID uuid.UUID) bool {
	var scan models.Scan
	err := DB.Where("target_id = ? AND scanner = ? AND status IN (?)",
		targetID,
		"acunetix",
		[]string{models.ScanStatusCompleted, models.ScanStatusProcessing}).
		First(&scan).Error
	return err == nil
}

func (a *AssetService) DeleteAcunetixTargets(targetIDList []string, userID uuid.UUID) {

	targetJSON, err := json.Marshal(models.DeleteTargets{TargetIDList: targetIDList})
	if err != nil {
		logger.Log.Errorln("JSON encoding error:", err)
	}

	resp, err := utils.SendCustomRequestAcunetix("POST", "/api/v1/targets/delete", targetJSON, userID)
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

// Yardımcı fonksiyon: Kullanıcının ZAP scanner ayarlarını getir
func (a *AssetService) getUserScannerZAPSettings(userID uuid.UUID) (*models.ScannerSetting, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user couldn't find: %v", err)
	}

	var scannerSetting models.ScannerSetting
	if err := database.DB.Where("company_id = ? AND scanner = ?", user.CompanyID, "zap").First(&scannerSetting).Error; err != nil {
		return nil, fmt.Errorf("scanner settings couldn't find: %v", err)
	}

	return &scannerSetting, nil
}

/*
Add the URL to ZAP spider and start the scan.
http://localhost:8081/JSON/spider/action/scan/?apikey=6f1ebonoa9980csb8ls2895rl0&url=https%3A%2F%2Fwww.abdiibrahim.com&maxChildren=&recurse=1&contextName=&subtreeOnly=

Result:
{"scan":"2"}
*/
func (a *AssetService) AddZapSpiderURL(url string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	// TOOD: URL'i liste olarak al
	endpoint := fmt.Sprintf("/JSON/spider/action/scan/?apikey=%s&url=%s&maxChildren=&recurse=1&contextName=&subtreeOnly=",
		scannerSetting.APIKey,
		url)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("spider scan couldn't start: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Scan string `json:"scan"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("spider response couldn't handle: %v", err)
	}

	return result.Scan, nil
}

/*
Start scan vulnerability scan
http://localhost:8081/JSON/ascan/action/scan/?apikey=6f1ebonoa9980csb8ls2895rl0&url=https%3A%2F%2Fwww.abdiibrahim.com&recurse=1&inScopeOnly=&scanPolicyName=&method=&postData=&contextId=

Result:

	{
	  "scan": "2"
	}
*/
func (a *AssetService) AddZapScanURL(url string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/ascan/action/scan/?apikey=%s&url=%s&recurse=1&inScopeOnly=&scanPolicyName=&method=&postData=&contextId=",
		scannerSetting.APIKey,
		url)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("vulnerability scan couldn't start: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Scan string `json:"scan"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("scan response couldn't handle: %v", err)
	}

	return result.Scan, nil
}

/*
Get the scan status
http://localhost:8081/JSON/ascan/view/status/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=2

Percentage of the scan is returned.
Result:

	{
	  "status": "100"
	}
*/
func (a *AssetService) GetZapScanStatus(scanID string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/ascan/view/status/?apikey=%s&scanId=%s", scannerSetting.APIKey, scanID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("scan status couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("status response couldn't handle: %v", err)
	}

	return result.Status, nil
}

/*
Alarm numbers by scanid
http://localhost:8081/JSON/ascan/view/alertsIds/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=1

Result:

	{
	  "alertsIds": [
	    "4953",
	    "4954",
	    "4955",
	    "4956",
	    "4957",
	    "4958",
	    "4959",
	    "4960",
	    "4961",
	    "4962",
	    "4963",
	    "4964"
	  ]
	}
*/
func (a *AssetService) GetZapAlerts(scanID string, userID uuid.UUID) ([]string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return nil, fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/ascan/view/alertsIds/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return nil, fmt.Errorf("alerts couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		AlertsIds []string `json:"alertsIds"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("alerts response couldn't handle: %v", err)
	}

	return result.AlertsIds, nil
}

/*
Get the scan result
Alarm detaylarını ID'ye göre çekme
http://localhost:8081/JSON/alert/view/alert/?apikey=6f1ebonoa9980csb8ls2895rl0&id=86


{
  "alert": {
    "sourceid": "3",
    "other": "",
    "method": "GET",
    "evidence": "",
    "pluginId": "10020",
    "cweid": "1021",
    "confidence": "Medium",
    "sourceMessageId": 1,
    "wascid": "15",
    "description": "The response does not protect against 'ClickJacking' attacks. It should include either Content-Security-Policy with 'frame-ancestors' directive or X-Frame-Options.",
    "messageId": "1",
    "inputVector": "",
    "url": "https://www.betek.com.tr/",
    "tags": {
      "OWASP_2021_A05": "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
      "CWE-1021": "https://cwe.mitre.org/data/definitions/1021.html",
      "WSTG-v42-CLNT-09": "https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/11-Client-side_Testing/09-Testing_for_Clickjacking",
      "OWASP_2017_A06": "https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration.html"
    },
    "reference": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
    "solution": "Modern Web browsers support the Content-Security-Policy and X-Frame-Options HTTP headers. Ensure one of them is set on all web pages returned by your site/app.\nIf you expect the page to be framed only by pages on your server (e.g. it's part of a FRAMESET) then you'll want to use SAMEORIGIN, otherwise if you never expect the page to be framed, you should use DENY. Alternatively consider implementing Content Security Policy's \"frame-ancestors\" directive.",
    "alert": "Missing Anti-clickjacking Header",
    "param": "x-frame-options",
    "attack": "",
    "name": "Missing Anti-clickjacking Header",
    "risk": "Medium",
    "id": "8",
    "alertRef": "10020-1"
  }
}
*/

func (a *AssetService) GetZapAlertDetail(alertID string, userID uuid.UUID) (models.Finding, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return models.Finding{}, fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/alert/view/alert/?apikey=%s&id=%s",
		scannerSetting.APIKey,
		alertID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return models.Finding{}, fmt.Errorf("alert detail couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Alert struct {
			URL         string `json:"url"`
			Risk        string `json:"risk"`
			Name        string `json:"name"`
			Evidence    string `json:"evidence"`
			Severity    string `json:"severity"`
			CWE         string `json:"cweid"`
			Description string `json:"description"`
		} `json:"alert"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return models.Finding{}, fmt.Errorf("alert detail response couldn't handle: %v", err)
	}

	finding := models.Finding{
		URL:               result.Alert.URL,
		Risk:              result.Alert.Risk,
		VulnerabilityName: result.Alert.Name,
		Location:          result.Alert.Evidence,
		Severity:          result.Alert.Severity,
	}

	return finding, nil
}

/*
Remove scan
http://localhost:8081/JSON/spider/action/removeScan/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=0

Result:

	{
	  "Result": "OK"
	}
*/
func (a *AssetService) RemoveZapScan(scanID string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/spider/action/removeScan/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("scan couldn't be deleted: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Result string `json:"Result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("deletion response couldn't handle: %v", err)
	}

	return result.Result, nil
}

/*
Pause Scan
http://localhost:8081/JSON/ascan/action/pause/?apikey=6f1ebonoa9980csb8ls2895rl0&scanId=2

Result:

	{
	  "Result": "OK"
	}
*/
func (a *AssetService) PauseZapScan(scanID string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/ascan/action/pause/?apikey=%s&scanId=%s",
		scannerSetting.APIKey,
		scanID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("scan couldn't stopped: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Result string `json:"Result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("stopping response couldn't handle: %v", err)
	}

	return result.Result, nil
}

// ProcessScanResults processes and stores scan findings
func (a *AssetService) ProcessScanResults(scan *models.Scan, userID uuid.UUID) error {
	// Get alerts
	alertIDs, err := a.GetZapAlerts(scan.ZapVulnScanID, userID)
	if err != nil {
		return err
	}

	// Process each alert
	for _, alertID := range alertIDs {
		finding, err := a.GetZapAlertDetail(alertID, userID)
		if err != nil {
			continue // Log error but continue processing other alerts
		}

		// Associate finding with scan
		finding.ScanID = scan.ID

		if err := database.DB.Create(&finding).Error; err != nil {
			return fmt.Errorf("couldn't save finding: %v", err)
		}
	}

	// Update scan status and vulnerability count
	scan.Status = models.ScanStatusCompleted
	scan.VulnerabilityCount = len(alertIDs)
	if err := database.DB.Save(scan).Error; err != nil {
		return fmt.Errorf("couldn't update scan status: %v", err)
	}

	return nil
}

func (a *AssetService) StartScan(url string, userID uuid.UUID) (*models.Scan, error) {
	// Get user info
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
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
		return nil, fmt.Errorf("couldn't create scan record: %v", err)
	}

	// Start spider scan
	spiderScanID, err := a.AddZapSpiderURL(url, userID)
	if err != nil {
		scan.Status = models.ScanStatusFailed
		database.DB.Save(scan)
		return nil, err
	}

	// Wait for spider scan to complete
	for {
		status, err := a.GetZapSpiderStatus(spiderScanID, userID)
		if err != nil {
			scan.Status = models.ScanStatusFailed
			database.DB.Save(scan)
			return nil, err
		}

		if status == "100" {
			break
		}
		time.Sleep(5 * time.Second)
	}

	// Start vulnerability scan
	vulnScanID, err := a.AddZapScanURL(url, userID)
	if err != nil {
		scan.Status = models.ScanStatusFailed
		database.DB.Save(scan)
		return nil, err
	}

	// Store scan IDs in database
	scan.ZapSpiderScanID = spiderScanID
	scan.ZapVulnScanID = vulnScanID
	if err := database.DB.Save(scan).Error; err != nil {
		return nil, fmt.Errorf("couldn't update scan record: %v", err)
	}

	return scan, nil
}

// GetZapSpiderStatus gets the status of a ZAP spider scan
func (a *AssetService) GetZapSpiderStatus(spiderScanID string, userID uuid.UUID) (string, error) {
	scannerSetting, err := a.getUserScannerZAPSettings(userID)
	if err != nil {
		return "", fmt.Errorf("scanner settings couldn't fetch: %v", err)
	}

	endpoint := fmt.Sprintf("/JSON/spider/view/status/?apikey=%s&scanId=%s", scannerSetting.APIKey, spiderScanID)

	resp, err := utils.SendGETRequestZap(endpoint, scannerSetting.APIKey, scannerSetting.ScannerURL, scannerSetting.ScannerPort)
	if err != nil {
		return "", fmt.Errorf("spider status couldn't get: %v", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("status response couldn't handle: %v", err)
	}

	return result.Status, nil
}

// CheckScanStatus checks the current status of a scan
func (a *AssetService) CheckScanStatus(scanID uuid.UUID, userID uuid.UUID) (string, error) {
	var scan models.Scan
	if err := database.DB.First(&scan, "id = ?", scanID).Error; err != nil {
		return "", fmt.Errorf("scan not found: %v", err)
	}

	if scan.Status != models.ScanStatusProcessing {
		return scan.Status, nil
	}

	// Check ZAP scan status
	status, err := a.GetZapScanStatus(scan.ZapVulnScanID, userID)
	if err != nil {
		return "", err
	}

	if status == "100" {
		// Process results when scan is complete
		if err := a.ProcessScanResults(&scan, userID); err != nil {
			scan.Status = models.ScanStatusFailed
			database.DB.Save(&scan)
			return scan.Status, err
		}
	}

	return scan.Status, nil
}

// Lists semgrep deployments
func (a *AssetService) SemgrepListDeployments(userID uuid.UUID) ([]models.SemgrepDeployment, error) {
	resp, err := utils.SendGETRequestSemgrep("/api/v1/deployments", userID)
	if err != nil {
		return nil, fmt.Errorf("deployments couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Deployments []models.SemgrepDeployment `json:"deployments"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("deployment response couldn't handle: %v", err)
	}

	return response.Deployments, nil
}

// Lists semgrep projects
func (a *AssetService) SemgrepListProjects(deploymentSlug string, userID uuid.UUID) ([]models.SemgrepProject, error) {
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/projects", deploymentSlug)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		return nil, fmt.Errorf("projeler couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Projects []models.SemgrepProject `json:"projects"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("project response couldn't handle: %v", err)
	}

	return response.Projects, nil
}

// Fetches scan details from the Semgrep server
func (a *AssetService) SemgrepGetScanDetails(deploymentID string, scanID int, userID uuid.UUID) (*models.SemgrepScan, error) {
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/scan/%d", deploymentID, scanID)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		return nil, fmt.Errorf("scan details couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var scan models.SemgrepScan
	if err := json.NewDecoder(resp.Body).Decode(&scan); err != nil {
		return nil, fmt.Errorf("scan response couldn't handle: %v", err)
	}

	// Veritabanına kaydet
	dbScan := models.Scan{
		Scanner:            "semgrep",
		Status:             models.ScanStatusCompleted,
		TargetURL:          scan.Meta.RepoURL,
		VulnerabilityCount: scan.Stats.Findings,
	}

	if err := database.DB.Create(&dbScan).Error; err != nil {
		return nil, fmt.Errorf("semgrep scan couldn't save: %v", err)
	}

	return &scan, nil
}

// Lists semgrep scans
func (a *AssetService) SemgrepListScans(deploymentID string, user_id uuid.UUID) ([]models.SemgrepScan, error) {
	param := models.SemgrepScanSearchParams{}

	body, err := json.Marshal(param)
	if err != nil {
		return nil, fmt.Errorf("scan search parameters couldn't encode: %v", err)
	}

	resp, err := utils.SendCustomRequestSemgrep("POST", "/api/v1/deployments/"+deploymentID+"/scans/search", body, user_id)
	if err != nil {
		return nil, fmt.Errorf("scan search parameters couldn't encode: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Scans []models.SemgrepScan `json:"scans"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("scan response couldn't handle: %v", err)
	}

	return response.Scans, nil
}

// Lists semgrep findings
func (a *AssetService) SemgrepListFindings(deploymentSlug string, userID uuid.UUID) ([]models.Finding, error) {
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/findings", deploymentSlug)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
		return nil, fmt.Errorf("findings couldn't fetch: %v", err)
	}
	defer resp.Body.Close()

	var response struct {
		Findings []struct {
			ID         string `json:"id"`
			Repository struct {
				Name string `json:"name"`
				URL  string `json:"url"`
			} `json:"repository"`
			Severity    string `json:"severity"`
			Status      string `json:"status"`
			RuleName    string `json:"rule_name"`
			RuleMessage string `json:"rule_message"`
			Location    struct {
				FilePath string `json:"file_path"`
				Line     int    `json:"line"`
			} `json:"location"`
		} `json:"findings"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("finding response couldn't handle: %v", err)
	}

	var findings []models.Finding
	for _, f := range response.Findings {
		finding := models.Finding{
			URL:               f.Repository.URL,
			Risk:              f.Severity,
			VulnerabilityName: f.RuleName,
			Location:          fmt.Sprintf("%s:%d", f.Location.FilePath, f.Location.Line),
			Severity:          f.Severity,
		}
		findings = append(findings, finding)
	}

	return findings, nil
}

// Lists semgrep secrets findings
func (a *AssetService) SemgrepListSecrets(deploymentID string, userID uuid.UUID) ([]models.Finding, error) {
	endpoint := fmt.Sprintf("/api/v1/deployments/%s/secrets", deploymentID)
	resp, err := utils.SendGETRequestSemgrep(endpoint, userID)
	if err != nil {
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
		return nil, fmt.Errorf("secrets response couldn't handle: %v", err)
	}

	var findings []models.Finding
	for _, f := range response.Findings {
		finding := models.Finding{
			URL:               f.Repository.URL,
			Risk:              f.Severity,
			VulnerabilityName: fmt.Sprintf("Secret: %s", f.Type),
			Location:          f.FindingPath,
			Severity:          f.Severity,
		}
		findings = append(findings, finding)
	}

	return findings, nil
}
