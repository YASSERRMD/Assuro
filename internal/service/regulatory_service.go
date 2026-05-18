package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
)

// RegulatoryRequirement is a requirement with its framework context.
type RegulatoryRequirement struct {
	ID              string   `json:"id"`
	FrameworkKey    string   `json:"framework_key"`
	FrameworkName   string   `json:"framework_name"`
	RefCode         string   `json:"ref_code"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	ArticleRef      string   `json:"article_ref,omitempty"`
	ObligationLevel string   `json:"obligation_level"`
	Tags            []string `json:"tags"`
}

// RegulatoryControl is a control with its requirement mappings.
type RegulatoryControl struct {
	ID       string   `json:"id"`
	Key      string   `json:"key"`
	Title    string   `json:"title"`
	Desc     string   `json:"description"`
	Domain   string   `json:"domain"`
	Guidance string   `json:"guidance,omitempty"`
	Tags     []string `json:"tags"`
}

// RegulatoryService handles regulatory content queries.
type RegulatoryService struct {
	db      *store.DB
	queries *qgen.Queries
}

// NewRegulatoryService creates a RegulatoryService.
func NewRegulatoryService(db *store.DB) *RegulatoryService {
	return &RegulatoryService{db: db, queries: qgen.New(db.Pool())}
}

// ListRequirements returns all requirements, optionally filtered by framework key.
func (s *RegulatoryService) ListRequirements(ctx context.Context, frameworkKey string) ([]RegulatoryRequirement, error) {
	var query string
	var args []any

	if frameworkKey != "" {
		query = `
			SELECT fr.id, fw.key, fw.name, fr.ref_code, fr.title,
			       COALESCE(fr.description,''), COALESCE(fr.article_ref,''),
			       COALESCE(fr.obligation_level,'mandatory'), COALESCE(fr.tags,'{}')
			FROM framework_requirements fr
			JOIN frameworks fw ON fw.id = fr.framework_id
			WHERE fw.key = $1
			ORDER BY fr.ref_code`
		args = []any{frameworkKey}
	} else {
		query = `
			SELECT fr.id, fw.key, fw.name, fr.ref_code, fr.title,
			       COALESCE(fr.description,''), COALESCE(fr.article_ref,''),
			       COALESCE(fr.obligation_level,'mandatory'), COALESCE(fr.tags,'{}')
			FROM framework_requirements fr
			JOIN frameworks fw ON fw.id = fr.framework_id
			ORDER BY fw.key, fr.ref_code`
	}

	rows, err := s.db.Pool().Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list requirements: %w", err)
	}
	defer rows.Close()

	var out []RegulatoryRequirement
	for rows.Next() {
		var r RegulatoryRequirement
		if err := rows.Scan(&r.ID, &r.FrameworkKey, &r.FrameworkName,
			&r.RefCode, &r.Title, &r.Description, &r.ArticleRef,
			&r.ObligationLevel, &r.Tags); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// SearchRequirements searches requirements by keyword across title and description.
func (s *RegulatoryService) SearchRequirements(ctx context.Context, q string) ([]RegulatoryRequirement, error) {
	if strings.TrimSpace(q) == "" {
		return s.ListRequirements(ctx, "")
	}
	pattern := "%" + strings.ToLower(q) + "%"
	rows, err := s.db.Pool().Query(ctx, `
		SELECT fr.id, fw.key, fw.name, fr.ref_code, fr.title,
		       COALESCE(fr.description,''), COALESCE(fr.article_ref,''),
		       COALESCE(fr.obligation_level,'mandatory'), COALESCE(fr.tags,'{}')
		FROM framework_requirements fr
		JOIN frameworks fw ON fw.id = fr.framework_id
		WHERE lower(fr.title) LIKE $1 OR lower(fr.description) LIKE $1
		   OR lower(fr.ref_code) LIKE $1
		ORDER BY fw.key, fr.ref_code`,
		pattern,
	)
	if err != nil {
		return nil, fmt.Errorf("search requirements: %w", err)
	}
	defer rows.Close()

	var out []RegulatoryRequirement
	for rows.Next() {
		var r RegulatoryRequirement
		if err := rows.Scan(&r.ID, &r.FrameworkKey, &r.FrameworkName,
			&r.RefCode, &r.Title, &r.Description, &r.ArticleRef,
			&r.ObligationLevel, &r.Tags); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// ListControls returns all global controls, optionally filtered by domain.
func (s *RegulatoryService) ListControls(ctx context.Context, domain string) ([]RegulatoryControl, error) {
	var rows interface {
		Next() bool
		Scan(...any) error
		Err() error
		Close()
	}
	var err error

	if domain != "" {
		r, e := s.db.Pool().Query(ctx, `
			SELECT id, key, title, COALESCE(description,''), domain,
			       COALESCE(guidance,''), COALESCE(tags,'{}')
			FROM controls WHERE org_id IS NULL AND domain = $1
			ORDER BY key`, domain)
		rows, err = r, e
	} else {
		r, e := s.db.Pool().Query(ctx, `
			SELECT id, key, title, COALESCE(description,''), domain,
			       COALESCE(guidance,''), COALESCE(tags,'{}')
			FROM controls WHERE org_id IS NULL
			ORDER BY domain, key`)
		rows, err = r, e
	}
	if err != nil {
		return nil, fmt.Errorf("list controls: %w", err)
	}
	defer rows.Close()

	var out []RegulatoryControl
	for rows.Next() {
		var c RegulatoryControl
		if err := rows.Scan(&c.ID, &c.Key, &c.Title, &c.Desc, &c.Domain, &c.Guidance, &c.Tags); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
