package models

import (
	"fmt"
	"strings"
	"time"
)

const SemgrepTimeLayoutSpace = "2006-01-02 15:04:05.000000"

type SemgrepDeployment struct {
	Slug     string `json:"slug"`
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Findings struct {
		URL string `json:"url"`
	} `json:"findings"`
}

const SemgrepTimeLayoutRFC3339 = time.RFC3339Nano // Use the standard library constant

// SemgrepTime is a custom type to handle Semgrep's potentially varying timestamp formats.
type SemgrepTime struct {
	time.Time
}

// UnmarshalJSON implements the json.Unmarshaler interface for SemgrepTime.
// It tries parsing multiple potential layouts from the Semgrep API.
func (st *SemgrepTime) UnmarshalJSON(b []byte) error {
	// 1. Get the string value from the JSON bytes (trimming quotes)
	s := strings.Trim(string(b), "\"")

	// 2. Handle null or empty values from JSON
	if s == "null" || s == "" {
		st.Time = time.Time{} // Set to zero value for time
		return nil
	}

	// 3. Try parsing with the RFC3339 layout first (often more standard)
	parsedTime, errRFC := time.Parse(SemgrepTimeLayoutRFC3339, s)
	if errRFC == nil {
		// Success with RFC3339 layout
		st.Time = parsedTime
		return nil
	}

	// 4. If RFC3339 failed, try parsing with the space-separated layout
	parsedTime, errSpace := time.Parse(SemgrepTimeLayoutSpace, s)
	if errSpace == nil {
		// Success with space layout
		st.Time = parsedTime
		return nil
	}

	// 5. If both layouts failed, return a combined error
	// We return the first error (errRFC) as it might be the more common format,
	// but log that both failed for debugging. You could potentially combine errors too.
	// logger.Log.Debugf("Failed to parse time %q with both RFC3339 (%v) and Space (%v) layouts", s, errRFC, errSpace)
	return fmt.Errorf("cannot parse time %q using known layouts [%q (%v), %q (%v)]",
		s, SemgrepTimeLayoutRFC3339, errRFC, SemgrepTimeLayoutSpace, errSpace)
}

type SemgrepProject struct {
	ID            int         `json:"id"`
	Name          string      `json:"name"`
	URL           string      `json:"url"`
	Tags          []string    `json:"tags"`
	CreatedAt     SemgrepTime `json:"created_at"`     // Use custom type
	LatestScanAt  SemgrepTime `json:"latest_scan_at"` // Use custom type
	PrimaryBranch string      `json:"primary_branch"`
	DefaultBranch string      `json:"default_branch"`
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
		Findings  int     `json:"findings"`
		TotalTime float32 `json:"total_time"`
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
