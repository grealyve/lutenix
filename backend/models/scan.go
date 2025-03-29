package models

import (
	"time"

	"github.com/google/uuid"
)

// Scan status constants
const (
	ScanStatusPending    = "pending"
	ScanStatusProcessing = "processing"
	ScanStatusCompleted  = "completed"
	ScanStatusFailed     = "failed"
)

type Scan struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID          uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
	CreatedBy          uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	Scanner            string    `gorm:"type:varchar(50);not null" json:"scanner"`
	TargetURL          string    `gorm:"type:text;not null" json:"target_url"`
	Status             string    `gorm:"type:varchar(50);not null" json:"status"`
	VulnerabilityCount int       `gorm:"default:0" json:"vulnerability_count"`
	ZapSpiderScanID    string    `gorm:"type:varchar(50)" json:"zap_spider_scan_id"`
	ZapVulnScanID      string    `gorm:"type:varchar(50)" json:"zap_vuln_scan_id"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Company            Company   `gorm:"foreignKey:CompanyID" json:"-"`
	Findings           []Finding `gorm:"foreignKey:ScanID" json:"-"`
	DeploymentSlug     string    `gorm:"type:varchar(50)" json:"deployment_slug"`
}
