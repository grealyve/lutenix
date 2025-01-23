package models

import "time"

type Group struct {
	GroupID     string `json:"group_id"`
	Name        string `json:"name"`
	TargetCount int    `json:"target_count"`
	Description string `json:"description"`
	VulnCount   struct {
		High   int `json:"high"`
		Medium int `json:"medium"`
		Low    int `json:"low"`
		Info   int `json:"info"`
	} `json:"vuln_count"`
}

type TargetGroupsListResponse struct {
	Groups []struct {
		GroupID     string `json:"group_id"`
		Name        string `json:"name"`
		TargetCount int    `json:"target_count"`
		Description string `json:"description"`
		VulnCount   struct {
			High   int `json:"high"`
			Medium int `json:"medium"`
			Low    int `json:"low"`
			Info   int `json:"info"`
		} `json:"vuln_count"`
	} `json:"groups"`
	Pagination struct {
		Count      int      `json:"count"`
		Cursors    []string `json:"cursors"`
		CursorHash string   `json:"cursor_hash"`
		Sort       string   `json:"sort"`
	} `json:"pagination"`
}

type Target struct {
	Address                  string `json:"address" validate:"required,url"`
	Description              string `json:"description,omitempty"`
	Type                     string `json:"type,omitempty"`
	Criticality              int    `json:"criticality,omitempty"`
	FQDNStatus               string `json:"fqdn_status,omitempty"`
	FQDNTMHash               string `json:"fqdn_tm_hash,omitempty"`
	DeletedAt                string `json:"deleted_at,omitempty"`
	FQDN                     string `json:"fqdn,omitempty"`
	FQDNHash                 string `json:"fqdn_hash,omitempty"`
	DefaultScanningProfileID string `json:"default_scanning_profile_id,omitempty"`
}

type TriggerScan struct {
	ProfileID   string   `json:"profile_id"`
	Incremental bool     `json:"incremental"`
	Schedule    Schedule `json:"schedule"`
	TargetID    string   `json:"target_id"`
}

type Schedule struct {
	Disable       bool        `json:"disable"`
	StartDate     interface{} `json:"start_date"`
	TimeSensitive bool        `json:"time_sensitive"`
}

type GetGroupTargetList struct {
	TargetIDList []string `json:"target_id_list"`
}

type AddGroupTargetList struct {
	Targets []struct {
		Address     string `json:"address"`
		Description string `json:"description"`
	} `json:"targets"`
	Groups []string `json:"groups"`
}

type TargetResponse struct {
	TargetID string `json:"target_id"`
	Address  string `json:"address"`
}

type TargetStatsResponse struct {
	TotalTargets    int `json:"total_targets"`
	ScanningTargets int `json:"scanning_targets"`
}

type AllTarget struct {
	Address                  string         `json:"address"`
	ContinuousMode           bool           `json:"continuous_mode"`
	Criticality              int            `json:"criticality"`
	DefaultScanningProfileID string         `json:"default_scanning_profile_id"`
	DeletedAt                interface{}    `json:"deleted_at"`
	Description              string         `json:"description"`
	FQDN                     string         `json:"fqdn"`
	FQDNHash                 string         `json:"fqdn_hash"`
	FQDNStatus               string         `json:"fqdn_status"`
	FQDNTMHash               string         `json:"fqdn_tm_hash"`
	IssueTrackerID           interface{}    `json:"issue_tracker_id"`
	LastScanDate             string         `json:"last_scan_date"`
	LastScanID               string         `json:"last_scan_id"`
	LastScanSessionID        string         `json:"last_scan_session_id"`
	LastScanSessionStatus    string         `json:"last_scan_session_status"`
	ManualIntervention       bool           `json:"manual_intervention"`
	SeverityCounts           map[string]int `json:"severity_counts"`
	TargetID                 string         `json:"target_id"`
	Threat                   int            `json:"threat"`
	Type                     interface{}    `json:"type"`
	Verification             interface{}    `json:"verification"`
}

type Pagination struct {
	Count      int         `json:"count"`
	CursorHash string      `json:"cursor_hash"`
	Cursors    []string    `json:"cursors"`
	Sort       interface{} `json:"sort"`
}

type Response struct {
	Targets    []TargetResponse `json:"targets"`
	Pagination struct {
		Cursors []string `json:"cursors"`
	}
}

type TargetConfig struct {
	ScanSpeed                  string         `json:"scan_speed"`
	Login                      Login          `json:"login"`
	SSHCredentials             SSHCredentials `json:"ssh_credentials"`
	DefaultScanningProfileID   string         `json:"default_scanning_profile_id"`
	Sensor                     bool           `json:"sensor"`
	UserAgent                  string         `json:"user_agent"`
	CaseSensitive              string         `json:"case_sensitive"`
	LimitCrawlerScope          bool           `json:"limit_crawler_scope"`
	ExcludedPaths              []string       `json:"excluded_paths"`
	Authentication             Authentication `json:"authentication"`
	Proxy                      Proxy          `json:"proxy"`
	Technologies               []string       `json:"technologies"`
	CustomHeaders              []string       `json:"custom_headers"`
	CustomCookies              []string       `json:"custom_cookies"`
	Debug                      bool           `json:"debug"`
	SkipLoginForm              bool           `json:"skip_login_form"`
	RestrictScansToImportFiles bool           `json:"restrict_scans_to_import_files"`
	ClientCertificatePassword  string         `json:"client_certificate_password"`
	ClientCertificateURL       interface{}    `json:"client_certificate_url"`
	IssueTrackerID             string         `json:"issue_tracker_id"`
	ExcludedHoursID            interface{}    `json:"excluded_hours_id"`
	PreseedMode                string         `json:"preseed_mode"`
}

type Login struct {
	Kind string `json:"kind"`
}

type SSHCredentials struct {
	Kind string `json:"kind"`
}

type Proxy struct {
	Enabled bool `json:"enabled"`
}

type Authentication struct {
	Enabled bool `json:"enabled"`
}

type AllScans struct {
	Pagination struct {
		Count      int         `json:"count"`
		CursorHash string      `json:"cursor_hash"`
		Cursors    []string    `json:"cursors"`
		Sort       interface{} `json:"sort"`
	} `json:"pagination"`
	Scans []struct {
		Criticality    int `json:"criticality"`
		CurrentSession struct {
			EventLevel     int    `json:"event_level"`
			Progress       int    `json:"progress"`
			ScanSessionID  string `json:"scan_session_id"`
			SeverityCounts struct {
				High   int `json:"high"`
				Info   int `json:"info"`
				Low    int `json:"low"`
				Medium int `json:"medium"`
			} `json:"severity_counts"`
			StartDate time.Time `json:"start_date"`
			Status    string    `json:"status"`
			Threat    int       `json:"threat"`
		} `json:"current_session"`
		Incremental      bool        `json:"incremental"`
		MaxScanTime      int         `json:"max_scan_time"`
		NextRun          interface{} `json:"next_run"`
		ProfileID        string      `json:"profile_id"`
		ProfileName      string      `json:"profile_name"`
		ReportTemplateID interface{} `json:"report_template_id"`
		ScanID           string      `json:"scan_id"`
		Schedule         struct {
			Disable       bool        `json:"disable"`
			HistoryLimit  interface{} `json:"history_limit"`
			Recurrence    interface{} `json:"recurrence"`
			StartDate     interface{} `json:"start_date"`
			TimeSensitive bool        `json:"time_sensitive"`
			Triggerable   bool        `json:"triggerable"`
		} `json:"schedule"`
		Target struct {
			Address     string `json:"address"`
			Criticality int    `json:"criticality"`
			Description string `json:"description"`
			Type        string `json:"type"`
		} `json:"target"`
		TargetID string `json:"target_id"`
	} `json:"scans"`
}

type ScanJSONModel struct {
	TargetID  string    `json:"target_id"`
	Status    string    `json:"status"`
	Address   string    `json:"address"`
	ScanID    string    `json:"scan_id"`
	StartDate time.Time `json:"start_date"`
}

type ScanJson struct {
	TargetID  string    `json:"target_id"`
	Status    string    `json:"status"`
	ScanID    string    `json:"scan_id"`
	StartDate time.Time `json:"start_date"`
}

type GenerateReport struct {
	TemplateID string `json:"template_id"`
	Source     Source `json:"source"`
}

type Source struct {
	ListType string   `json:"list_type"`
	IDList   []string `json:"id_list"`
}

type ReportsResponsePage struct {
	Pagination struct {
		Count      int           `json:"count"`
		CursorHash string        `json:"cursor_hash"`
		Cursors    []interface{} `json:"cursors"`
		Sort       interface{}   `json:"sort"`
	} `json:"pagination"`
	Reports []ReportResponse `json:"reports"`
}

type ReportResponse struct {
	Download       []string  `json:"download"`
	GenerationDate time.Time `json:"generation_date"`
	ReportID       string    `json:"report_id"`
	Source         struct {
		ListType    string   `json:"list_type"`
		Description string   `json:"description"`
		IDList      []string `json:"id_list"`
	} `json:"source"`
	Status       string `json:"status"`
	TemplateID   string `json:"template_id"`
	TemplateName string `json:"template_name"`
	TemplateType int    `json:"template_type"`
}

type ScanResultStruct struct {
	Pagination struct {
		Count      int           `json:"count"`
		CursorHash string        `json:"cursor_hash"`
		Cursors    []interface{} `json:"cursors"`
		Sort       interface{}   `json:"sort"`
	} `json:"pagination"`
	Results []struct {
		EndDate   time.Time `json:"end_date"`
		ResultID  string    `json:"result_id"`
		ScanID    string    `json:"scan_id"`
		StartDate time.Time `json:"start_date"`
		Status    string    `json:"status"`
	} `json:"results"`
}

type VulnerabilitiesStruct struct {
	Vulnerabilities []Vulnerability `json:"vulnerabilities"`
	Pagination      struct {
		Count      int           `json:"count"`
		CursorHash string        `json:"cursor_hash"`
		Cursors    []interface{} `json:"cursors"`
		Sort       string        `json:"sort"`
	} `json:"pagination"`
}

type Vulnerability struct {
	AffectsDetail string      `json:"affects_detail"`
	AffectsURL    string      `json:"affects_url"`
	App           string      `json:"app"`
	Confidence    int         `json:"confidence"`
	Criticality   int         `json:"criticality"`
	LastSeen      interface{} `json:"last_seen"`
	LocID         int         `json:"loc_id"`
	Severity      int         `json:"severity"`
	Status        string      `json:"status"`
	Tags          []string    `json:"tags"`
	TargetID      string      `json:"target_id"`
	VtCreated     time.Time   `json:"vt_created"`
	VtID          string      `json:"vt_id"`
	VtName        string      `json:"vt_name"`
	VtUpdated     time.Time   `json:"vt_updated"`
	VulnID        string      `json:"vuln_id"`
}

type DeleteGroups struct {
	GroupIDList []string `json:"group_id_list"`
}

type DeleteTargets struct {
	TargetIDList []string `json:"target_id_list"`
}