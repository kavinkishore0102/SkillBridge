package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// GitHubService handles GitHub API operations
type GitHubService struct {
	Token string
	BaseURL string
}

// NewGitHubService creates a new GitHub service instance
func NewGitHubService(token string) *GitHubService {
	return &GitHubService{
		Token:   token,
		BaseURL: "https://api.github.com",
	}
}

// CreateRepositoryRequest represents the request to create a GitHub repository
type CreateRepositoryRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Private     bool   `json:"private"`
	AutoInit    bool   `json:"auto_init"`
}

// CreateRepositoryResponse represents the response from GitHub API
type CreateRepositoryResponse struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	FullName string `json:"full_name"`
	HTMLURL  string `json:"html_url"`
	CloneURL string `json:"clone_url"`
	SSHURL   string `json:"ssh_url"`
}

// AddCollaboratorRequest represents the request to add a collaborator
type AddCollaboratorRequest struct {
	Permission string `json:"permission"` // pull, push, admin, maintain, triage
}

// CreateRepository creates a new GitHub repository
func (gs *GitHubService) CreateRepository(name, description string, private bool) (*CreateRepositoryResponse, error) {
	// Sanitize repository name (GitHub requirements)
	repoName := sanitizeRepoName(name)
	
	reqBody := CreateRepositoryRequest{
		Name:        repoName,
		Description: description,
		Private:     private,
		AutoInit:    true, // Initialize with README
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", gs.BaseURL+"/user/repos", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+gs.Token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, string(body))
	}

	var repoResp CreateRepositoryResponse
	if err := json.Unmarshal(body, &repoResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &repoResp, nil
}

// AddCollaborator adds a collaborator to the repository
func (gs *GitHubService) AddCollaborator(owner, repo, username string, permission string) error {
	if permission == "" {
		permission = "push" // Default permission
	}

	reqBody := AddCollaboratorRequest{
		Permission: permission,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/repos/%s/%s/collaborators/%s", gs.BaseURL, owner, repo, username)
	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+gs.Token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetUserInfo gets GitHub user information
func (gs *GitHubService) GetUserInfo() (map[string]interface{}, error) {
	req, err := http.NewRequest("GET", gs.BaseURL+"/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+gs.Token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API error: %d - %s", resp.StatusCode, string(body))
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return userInfo, nil
}

// sanitizeRepoName ensures the repository name meets GitHub requirements
func sanitizeRepoName(name string) string {
	// Replace spaces with hyphens
	name = strings.ReplaceAll(name, " ", "-")
	
	// Remove special characters except hyphens, underscores, and dots
	var result strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			result.WriteRune(r)
		}
	}
	
	name = result.String()
	
	// Ensure it doesn't start or end with special characters
	name = strings.Trim(name, "-_.")
	
	// Ensure it's not empty and has a reasonable length
	if name == "" {
		name = "skillbridge-project"
	}
	
	if len(name) > 100 {
		name = name[:100]
	}
	
	return strings.ToLower(name)
}

// CreateProjectRepository creates a repository for a SkillBridge project application
func CreateProjectRepository(projectTitle, studentName, companyName string, githubToken string) (*CreateRepositoryResponse, error) {
	if githubToken == "" {
		return nil, fmt.Errorf("GitHub token is required")
	}

	githubService := NewGitHubService(githubToken)
	
	// Create a meaningful repository name
	repoName := fmt.Sprintf("skillbridge-%s", sanitizeRepoName(projectTitle))
	description := fmt.Sprintf("SkillBridge Project: %s | Student: %s | Company: %s", projectTitle, studentName, companyName)
	
	// Create the repository (private by default for security)
	repo, err := githubService.CreateRepository(repoName, description, true)
	if err != nil {
		return nil, fmt.Errorf("failed to create repository: %w", err)
	}

	return repo, nil
}
