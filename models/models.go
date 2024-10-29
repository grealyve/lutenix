package models

import (
	"github.com/google/uuid"
)

type User struct {
	ID            int       `json:"id" gorm:"primaryKey"`
	First_Name    *string   `json:"first_name" validate:"required,min=2,max=30"`
	Last_Name     *string   `json:"last_name"  validate:"required,min=2,max=30"`
	Password      *string   `json:"password"   validate:"required,min=8"`
	Email         *string   `json:"email"      validate:"email,required"`
	Token         *string   `json:"token"`
	Refresh_token *string   `json:"refresh_token"`
	Created_At    *string   `json:"created_at"`
	User_ID       uuid.UUID `json:"user_id"`
}
