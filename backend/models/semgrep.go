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

const SemgrepTimeLayoutRFC3339 = time.RFC3339Nano 

type SemgrepTime struct {
	time.Time
}

func (st *SemgrepTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")

	if s == "null" || s == "" {
		st.Time = time.Time{} 
		return nil
	}

	parsedTime, errRFC := time.Parse(SemgrepTimeLayoutRFC3339, s)
	if errRFC == nil {
		st.Time = parsedTime
		return nil
	}

	parsedTime, errSpace := time.Parse(SemgrepTimeLayoutSpace, s)
	if errSpace == nil {
		st.Time = parsedTime
		return nil
	}

	return fmt.Errorf("cannot parse time %q using known layouts [%q (%v), %q (%v)]",
		s, SemgrepTimeLayoutRFC3339, errRFC, SemgrepTimeLayoutSpace, errSpace)
}

type SemgrepProject struct {
	ID            int         `json:"id"`
	Name          string      `json:"name"`
	URL           string      `json:"url"`
	Tags          []string    `json:"tags"`
	CreatedAt     SemgrepTime `json:"created_at"`    
	LatestScanAt  SemgrepTime `json:"latest_scan_at"`
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


type SemgrepRepoInfo struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	ProvisionedAt SemgrepTime `json:"provisionedAt"`
	LatestScan    struct {
		ID          string    `json:"id"`
		StartedAt   SemgrepTime `json:"startedAt"`
		CompletedAt SemgrepTime `json:"completedAt"`
		ExitCode    string    `json:"exitCode"`
		Status      string    `json:"status"`
		HasLogs     bool      `json:"hasLogs"`
	} `json:"latestScan"`
	DeploymentID        string   `json:"deploymentId"`
	URL                 string   `json:"url"`
	IgnoredFiles        []string `json:"ignoredFiles"`
	ProductIgnoredFiles struct {
		Sast    []string `json:"sast"`
		Sca     []string `json:"sca"`
		Secrets []string `json:"secrets"`
	} `json:"productIgnoredFiles"`
	FirstScanID      string   `json:"firstScanId"`
	IsSetup          bool     `json:"isSetup"`
	ScmLastSyncedAt  float64  `json:"scmLastSyncedAt,omitempty"`
	AuthorizedScopes []string `json:"authorizedScopes"`
	Provider         string   `json:"provider"`
	PrimaryRef       struct {
		ID         string `json:"id"`
		Ref        string `json:"ref"`
		IsOverride bool   `json:"isOverride"`
	} `json:"primaryRef"`
	DefaultRef struct {
		ID  string `json:"id"`
		Ref string `json:"ref"`
	} `json:"defaultRef"`
	LastScannedRef struct {
		ID  string `json:"id"`
		Ref string `json:"ref"`
	} `json:"lastScannedRef"`
	LatestFullScaScanAt SemgrepTime `json:"latestFullScaScanAt"`
	ScaInfo             struct {
		DependencyCounts map[string]interface{} `json:"dependencyCounts"`
	} `json:"scaInfo"`
	ScmType        string        `json:"scmType"`
	Tags           []interface{} `json:"tags"`
	IsArchived     bool          `json:"isArchived"`
	IsDisconnected bool          `json:"isDisconnected"`
	HasCodeAccess  bool          `json:"hasCodeAccess"`
	Refs           []interface{} `json:"refs"`
	LinkedRepos    []interface{} `json:"linkedRepos"`
}

type SemgrepRepository struct {
	Repos []SemgrepRepoInfo `json:"repos"`
}