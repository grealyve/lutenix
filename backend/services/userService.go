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

func (us *UserService) GetUserAPIKey(userID uuid.UUID, scanner string) (string, error) {
	user, err := us.GetUserByID(userID)
	if err != nil {
		return "", err
	}

	apiKey, err := database.GetAPIKey(scanner, user.CompanyID)
	if err != nil {
		return "", err
	}

	return apiKey, nil
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

	// Önce şirket adına göre arama yap
	err := database.DB.Where("name = ?", companyName).First(&company).Error
	if err == nil {
		// Şirket bulundu, ID'sini döndür
		return company.ID, nil
	}

	// Şirket bulunamadıysa yeni şirket oluştur
	if err == gorm.ErrRecordNotFound {
		newCompany := models.Company{
			Name: companyName,
		}

		if err := database.DB.Create(&newCompany).Error; err != nil {
			return uuid.Nil, fmt.Errorf("şirket oluşturulamadı: %v", err)
		}

		return newCompany.ID, nil
	}

	// Başka bir hata oluştuysa
	return uuid.Nil, err
}
