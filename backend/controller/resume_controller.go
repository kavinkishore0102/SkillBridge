package controller

import (
	"SkillBridge/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const resumeAPIKey = "ur_live_EK-wQZBkYKTxuTATom7PljhXTv8a127j"

type ResumeRequestBody struct {
	Location       string                `json:"location"`
	Experience     []ResumeExperience    `json:"experience"`
	Education      []ResumeEducation     `json:"education"`
	Projects       []ResumeProject       `json:"projects"`
	Certifications []ResumeCertification `json:"certifications"`
}

type ResumeExperience struct {
	Company  string   `json:"company"`
	Position string   `json:"position"`
	Location string   `json:"location"`
	Start    string   `json:"startDate"`
	End      string   `json:"endDate"`
	Summary  string   `json:"summary"`
	Points   []string `json:"highlights"`
}

type ResumeEducation struct {
	Institution string `json:"institution"`
	Degree      string `json:"degree"`
	Field       string `json:"field"`
	Start       string `json:"startDate"`
	End         string `json:"endDate"`
}

type ResumeCertification struct {
	Name string `json:"name"`
}

type ResumeProject struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Technologies []string `json:"technologies"`
	Highlights   []string `json:"highlights"`
}

// safeStrings ensures a nil slice becomes an empty slice (never marshalled as null)
func safeStrings(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

func GenerateResume(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	var body ResumeRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Build skills — never leave as null
	skillsList := []map[string]string{}
	if user.Skills != "" {
		for _, s := range strings.Split(user.Skills, ",") {
			trimmed := strings.TrimSpace(s)
			if trimmed != "" {
				skillsList = append(skillsList, map[string]string{"name": trimmed})
			}
		}
	}

	// Title fallback chain
	title := strings.TrimSpace(user.Position)
	if title == "" {
		title = strings.TrimSpace(user.Major)
	}
	if title == "" {
		title = "Professional"
	}

	// Bio fallback
	bio := strings.TrimSpace(user.Bio)
	if bio == "" {
		bio = fmt.Sprintf("%s with professional experience.", title)
	}

	// Location fallback
	location := strings.TrimSpace(body.Location)
	if location == "" {
		location = strings.TrimSpace(user.University)
	}

	// Build experience — ensure highlights is never null
	experience := []map[string]interface{}{}
	for _, e := range body.Experience {
		if e.Company == "" {
			continue
		}
		experience = append(experience, map[string]interface{}{
			"company":    e.Company,
			"position":   e.Position,
			"location":   e.Location,
			"startDate":  e.Start,
			"endDate":    e.End,
			"summary":    e.Summary,
			"highlights": safeStrings(e.Points),
		})
	}
	if experience == nil {
		experience = []map[string]interface{}{}
	}

	// Build education
	education := []map[string]interface{}{}
	for _, e := range body.Education {
		if e.Institution == "" {
			continue
		}
		education = append(education, map[string]interface{}{
			"institution": e.Institution,
			"degree":      e.Degree,
			"field":       e.Field,
			"startDate":   e.Start,
			"endDate":     e.End,
		})
	}

	// Build projects — ensure technologies and highlights are never null
	projects := []map[string]interface{}{}
	for _, p := range body.Projects {
		if p.Name == "" {
			continue
		}
		projects = append(projects, map[string]interface{}{
			"name":         p.Name,
			"description":  p.Description,
			"technologies": safeStrings(p.Technologies),
			"highlights":   safeStrings(p.Highlights),
		})
	}

	// Build certifications
	certifications := []map[string]string{}
	for _, cert := range body.Certifications {
		if cert.Name != "" {
			certifications = append(certifications, map[string]string{"name": cert.Name})
		}
	}

	// Build the final payload — exact format as required by useresume.ai
	payload := map[string]interface{}{
		"content": map[string]interface{}{
			"name":           user.Name,
			"email":          user.Email,
			"phone":          user.Phone,
			"location":       location,
			"title":          title,
			"bio":            bio,
			"skills":         skillsList,
			"experience":     experience,
			"projects":       projects,
			"education":      education,
			"certifications": certifications,
		},
		"style": map[string]string{
			"template": "modern-pro",
		},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build resume payload"})
		return
	}

	// Log the exact payload sent to API for debugging
	log.Printf("[ResumeAPI] Sending payload: %s", string(payloadBytes))

	req, err := http.NewRequest("POST", "https://useresume.ai/api/v3/resume/create", bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	req.Header.Set("Authorization", "Bearer "+resumeAPIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reach resume API: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read API response"})
		return
	}

	log.Printf("[ResumeAPI] Response status: %d, body: %s", resp.StatusCode, string(respBody))

	var apiResponse map[string]interface{}
	if err := json.Unmarshal(respBody, &apiResponse); err != nil {
		c.Data(resp.StatusCode, "application/json", respBody)
		return
	}

	c.JSON(resp.StatusCode, apiResponse)
}
