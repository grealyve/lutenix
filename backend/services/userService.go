package services

import (
	"github.com/google/uuid"
	"github.com/grealyve/lutenix/database"
	"github.com/grealyve/lutenix/models"
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
