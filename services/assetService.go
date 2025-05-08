package services

import (
	"gorm.io/gorm"
)

var (
	DB *gorm.DB
)

type AssetService struct{}