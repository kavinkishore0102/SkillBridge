package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name         string `json:"name"`
	Email        string `json:"email" gorm:"unique"`
	Password     string `json:"password,omitempty" gorm:"column:password"`
	Role         string `json:"role"`
	Bio          string `json:"bio"`
	GithubURL    string `json:"github_url"`
	LinkedIn     string `json:"linkedin"`
	Phone        string `json:"phone"`
	University   string `json:"university"`
	Major        string `json:"major"`
	Year         string `json:"year"`
	CompanyName  string `json:"company_name"`
	Position     string `json:"position"`
	PortfolioURL string `json:"portfolio_url"`
}
