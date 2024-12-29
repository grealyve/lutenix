package models

import (
	"time"

	"github.com/google/uuid"
)

type Scan struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID          uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
	Scanner            string    `gorm:"type:varchar(50);not null" json:"scanner"`
	TargetURL          string    `gorm:"type:text;not null" json:"target_url"`
	Status             string    `gorm:"type:varchar(50);not null" json:"status"`
	VulnerabilityCount int       `gorm:"default:0" json:"vulnerability_count"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Company            Company   `gorm:"foreignKey:CompanyID;constraint:OnDelete:CASCADE" json:"-"`
	Findings           []Finding `gorm:"foreignKey:ScanID" json:"-"`
}
