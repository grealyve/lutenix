package models

import (
	"time"

	"github.com/google/uuid"
)

type ScannerSetting struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CreatedBy   uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	CompanyID   uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
	Scanner     string    `gorm:"type:varchar(20);not null" json:"scanner"`
	APIKey      string    `gorm:"type:text;not null" json:"api_key"`
	ScannerURL  string    `gorm:"type:text" json:"scanner_url"`
	ScannerPort int       `gorm:"type:smallint" json:"scanner_port"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Company     Company   `gorm:"foreignKey:CompanyID" json:"-"`
}
