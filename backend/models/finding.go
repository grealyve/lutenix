package models

import (
	"time"

	"github.com/google/uuid"
)

type Finding struct {
    ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
    ScanID            uuid.UUID `gorm:"type:uuid;not null" json:"scan_id"`
    URL               string    `gorm:"type:text;not null" json:"url"`
    Risk              string    `gorm:"type:varchar(50);not null" json:"risk"`
    VulnerabilityName string    `gorm:"type:text;not null" json:"vulnerability_name"`
    Location          string    `gorm:"type:text" json:"location"`
    Severity          string    `gorm:"type:varchar(50);not null" json:"severity"`
    CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
    Scan              Scan      `gorm:"foreignKey:ScanID" json:"-"`
}
