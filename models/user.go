package models

type User struct {
	ID       uint   `gorm:"primaryKey"`
	Name     string `json:"name"`
	Email    string `gorm:"unique" json:"email"`
	Password string `gorm:"type:varchar(225)"`
	Role     string `json:"role"`
}
