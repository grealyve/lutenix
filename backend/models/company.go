package models

import (
	"time"

	"github.com/google/uuid"
)

type Company struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
    Name      string    `gorm:"type:varchar(255);unique;not null" json:"name"`
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
    UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
    Users     []User    `gorm:"foreignKey:CompanyID" json:"-"`
}
