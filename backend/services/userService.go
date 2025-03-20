package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/models"
	"gorm.io/gorm"
)

type UserService struct{}

func (us *UserService) GetUserByID(userID uuid.UUID) (*models.User, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (us *UserService) EmailExists(email string) (bool, error) {
	var count int64
	err := database.DB.Model(&models.User{}).Where("email = ?", email).Count(&count).Error
	return count > 0, err
}

func (us *UserService) CompanyExists(companyID uuid.UUID) (bool, error) {
	var count int64
	err := database.DB.Model(&models.Company{}).Where("id = ?", companyID).Count(&count).Error
	return count > 0, err
}

func (us *UserService) RegisterUser(user models.User) error {
	return database.DB.Create(&user).Error
}

func (us *UserService) GetOrCreateCompany(companyName string) (uuid.UUID, error) {
	var company models.Company

	err := database.DB.Where("name = ?", companyName).First(&company).Error
	if err == nil {
		return company.ID, nil
	}

	if err == gorm.ErrRecordNotFound {
		newCompany := models.Company{
			Name: companyName,
		}

		if err := database.DB.Create(&newCompany).Error; err != nil {
			return uuid.Nil, fmt.Errorf("company couldn't create: %v", err)
		}

		return newCompany.ID, nil
	}

	return uuid.Nil, err
}

func (us *UserService) UpdateUser(userID uuid.UUID, name, surname, email string) error {
	updates := map[string]any{}

	if name != "" {
		updates["name"] = name
	}
	if surname != "" {
		updates["surname"] = surname
	}
	if email != "" {
		updates["email"] = email
	}

	return database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error
}

func (us *UserService) UpdateScannerSetting(setting models.ScannerSetting) error {
	var existingSetting models.ScannerSetting
	result := database.DB.Where("company_id = ? AND scanner = ?", setting.CompanyID, setting.Scanner).First(&existingSetting)

	if result.Error == nil {
		return database.DB.Model(&existingSetting).Updates(map[string]interface{}{
			"api_key":      setting.APIKey,
			"scanner_url":  setting.ScannerURL,
			"scanner_port": setting.ScannerPort,
		}).Error
	} else if result.Error == gorm.ErrRecordNotFound {
		return database.DB.Create(&setting).Error
	}

	return result.Error
}

func (us *UserService) GetScannerSetting(userID uuid.UUID) (*models.ScannerSetting, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	var scannerSetting models.ScannerSetting
	if err := database.DB.Where("company_id = ?", user.CompanyID).First(&scannerSetting).Error; err != nil {
		return nil, err
	}

	return &scannerSetting, nil
}
