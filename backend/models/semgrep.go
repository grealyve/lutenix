package models

import "time"

type SemgrepDeployment struct {
	Slug     string `json:"slug"`
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Findings struct {
		URL string `json:"url"`
	} `json:"findings"`
}

type SemgrepProject struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	URL           string    `json:"url"`
	Tags          []string  `json:"tags"`
	CreatedAt     time.Time `json:"created_at"`
	LatestScanAt  time.Time `json:"latest_scan_at"`
	PrimaryBranch string    `json:"primary_branch"`
	DefaultBranch string    `json:"default_branch"`
}

type SemgrepScan struct {
	ID           int       `json:"id"`
	DeploymentID int       `json:"deployment_id"`
	RepositoryID int       `json:"repository_id"`
	StartedAt    time.Time `json:"started_at"`
	CompletedAt  time.Time `json:"completed_at"`
	Meta         struct {
		Branch     string `json:"branch"`
		RepoURL    string `json:"repo_url"`
		Repository string `json:"repository"`
	} `json:"meta"`
	Stats struct {
		Findings  int `json:"findings"`
		TotalTime int `json:"total_time"`
	} `json:"stats"`
}

type SemgrepScanSearchParams struct {
	RepositoryID int       `json:"repository_id"`
	IsFullScan   bool      `json:"is_full_scan"`
	Since        time.Time `json:"since"`
	TotalTime    struct {
		Min int `json:"min"`
		Max int `json:"max"`
	} `json:"total_time"`
	Statuses []string `json:"statuses"`
	Branch   string   `json:"branch"`
	Cursor   string   `json:"cursor"`
	Limit    int      `json:"limit"`
}
