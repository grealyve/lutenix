package services

import (
	"encoding/json"
	"io"

	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/grealyve/lutenix/utils"
	"gorm.io/gorm"
)

var (
	DB *gorm.DB
)

type AssetService struct{}

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
				Scanner: "Acunetix",
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
