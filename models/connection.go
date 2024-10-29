package models

import (
	"fmt"

	"github.com/grealyve/lutenix/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ConnectDB is a function to connect to the database
func ConnectDB(dbConfig *config.Config) (*gorm.DB, error) {
	// Create the DSN string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", dbConfig.DB_HOST, dbConfig.DB_PORT, dbConfig.DB_USER, dbConfig.DB_PASSWORD, dbConfig.DB_NAME, dbConfig.SSLMode)

	dbConnection, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	db, err := dbConnection.DB()
	if err := db.Ping(); err != nil {
		return nil, err
	}

	if err := autoMigrate(dbConnection); err != nil {
		return nil, fmt.Errorf("Migrating table error: %v", err)
	}

	return dbConnection, nil
}

func autoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(&User{}); err != nil {
		return err
	}

	return nil
}
