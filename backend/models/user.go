package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name      string `json:"name"`
	Email     string `json:"email" gorm:"unique"`
	Password  string `json:"-"`
	Role      string `json:"role"`
	Bio       string `json:"bio"`
	GithubURL string `json:"github_url"`
	LinkedIn  string `json:"linkedin"`
}
