package database

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/grealyve/lutenix/logger"
	"github.com/grealyve/lutenix/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB          *gorm.DB
	RedisClient *redis.Client
)

// ConnectDB is a function to connect to the database
func ConnectDB(dsn string) {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	db, err := DB.DB()
	if err != nil {
		panic(err)
	}

	if err := db.Ping(); err != nil {
		panic(err)
	}

	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

	if err := autoMigrate(DB); err != nil {
		logger.Log.Errorf("Migrating table error: %v", err)
	}
}

func autoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(&models.Company{}); err != nil {
		return err
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Scan{},
		&models.Finding{},
		&models.Report{},
		&models.ScannerSetting{},
	); err != nil {
		return err
	}

	return nil
}

func ConnectRedis(redisURL string) {
	RedisClient = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	if err := RedisClient.Ping(context.Background()).Err(); err != nil {
		panic(err)
	}
}

func AddTokenToBlacklist(token string) error {
	return RedisClient.Set(context.Background(), "blacklist:"+token, true, 24*time.Hour).Err()
}

func IsTokenBlacklisted(token string) (bool, error) {
	return RedisClient.Get(context.Background(), "blacklist:"+token).Bool()
}

// TODO: Bu SQL sorgusu companye göre yapılmalı.
func GetAPIKey(scanner string, companyID uuid.UUID) (string, error) {
	var result struct {
		APIKey string `gorm:"column:api_key"`
	}
	err := DB.Table("scanner_setting").
		Where("scanner = ? AND company_id = ?", scanner, companyID).
		First(&result).Error
	if err != nil {
		return "", err
	}
	return result.APIKey, nil
}
