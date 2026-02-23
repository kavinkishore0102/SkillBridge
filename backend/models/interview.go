package models

type InterviewResource struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Skill       string `json:"skill"`
	Type        string `json:"type"` // "video" or "question"
	Title       string `json:"title"`
	URL         string `json:"url"`     // For videos
	Content     string `json:"content"` // For questions
	Difficulty  string `json:"difficulty"`
	Description string `json:"description"`
}
