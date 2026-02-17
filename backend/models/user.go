package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name         string `json:"name"`
	Email        string `json:"email" gorm:"unique"`
	Password     string `json:"password,omitempty" gorm:"column:password"`
	Role         string `json:"role"`
	Bio          string `json:"bio"`
	Picture      string `json:"picture"` // Google profile picture URL
	GithubURL    string `json:"github_url"`
	GithubToken  string `json:"-" gorm:"column:github_token"` // Hidden from JSON, used for API calls
	LinkedIn     string `json:"linkedin"`
	Phone        string `json:"phone"`
	University   string `json:"university"`
	Major        string `json:"major"`
	Year         string `json:"year"`
	CompanyName  string `json:"company_name"`
	Position     string `json:"position"`
	PortfolioURL string `json:"portfolio_url"`
	Skills       string `json:"skills"`
}
