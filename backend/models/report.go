package models

import (
	"time"

	"github.com/google/uuid"
)

type Report struct {
    ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
    Name         string    `gorm:"type:varchar(255);not null" json:"name"`
    CompanyID    uuid.UUID `gorm:"type:uuid;not null" json:"company_id"`
    DownloadLink string    `gorm:"type:text;not null" json:"download_link"`
    ReportType   string    `gorm:"type:varchar(50);not null" json:"report_type"`
    CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
    Company      Company   `gorm:"foreignKey:CompanyID" json:"-"`
}
