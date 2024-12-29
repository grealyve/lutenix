package database

import (
	"github.com/grealyve/lutenix/backend/logger"
	"github.com/grealyve/lutenix/backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// ConnectDB is a function to connect to the database
func ConnectDB(dsn string) {
	DB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	db, err := DB.DB()
	if err := db.Ping(); err != nil {
		panic(err)
	}

	if err := autoMigrate(DB); err != nil {
		logger.Log.Errorf("Migrating table error: %v", err)
	}
}

func autoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.User{},
		&models.Company{},
		&models.Scan{},
		&models.Finding{},
		&models.Report{},
		&models.ScannerSetting{}); err != nil {
		return err
	}

	return nil
}
