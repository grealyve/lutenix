package models

import (
	"time"

	"github.com/google/uuid"
)

// Scan status constants
const (
	ScanStatusPending    = "Pending"
	ScanStatusQueued     = "Queued"
	ScanStatusProcessing = "Processing"
	ScanStatusCompleted  = "Completed"
	ScanStatusFailed     = "Failed"
	ScanStatusPaused     = "Paused"
)

var ScanStatusMap = map[string]string{
	"Pending":    ScanStatusPending,
	"Queued":     ScanStatusQueued,
	"Processing": ScanStatusProcessing,
	"Completed":  ScanStatusCompleted,
	"Failed":     ScanStatusFailed,
	"Paused":     ScanStatusPaused,
	"RUNNING":    ScanStatusProcessing,
	"PAUSED":     ScanStatusPaused,
}

type Scan struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID          uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
	CreatedBy          uuid.UUID `gorm:"type:uuid;not null" json:"created_by"`
	Scanner            string    `gorm:"type:varchar(50);not null" json:"scanner"`
	TargetURL          string    `gorm:"type:text;not null" json:"target"`
	Status             string    `gorm:"type:varchar(50);not null" json:"status"`
	VulnerabilityCount int       `gorm:"default:0" json:"vulnerability_count"`
	ZapSpiderScanID    string    `gorm:"type:varchar(50)" json:"zap_spider_scan_id"`
	ZapVulnScanID      string    `gorm:"type:varchar(50)" json:"zap_vuln_scan_id"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	Company            Company   `gorm:"foreignKey:CompanyID" json:"-"`    
	Findings           []Finding `gorm:"foreignKey:ScanID" json:"-"`     
	DeploymentSlug     string    `gorm:"type:varchar(50);omitempty" json:"deployment_slug,omitempty"`
	Progress           *int      `gorm:"-" json:"progress,omitempty"`
}

type ZapScanInfo struct {
	ID        uuid.UUID `json:"id"`
	TargetURL string    `json:"target"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}