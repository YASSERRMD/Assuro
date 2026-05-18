package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// OrgExport is the full JSON export payload for an organisation.
type OrgExport struct {
	ExportedAt string          `json:"exported_at"`
	OrgID      string          `json:"org_id"`
	Assets     []ExportRow     `json:"assets"`
	Vendors    []ExportRow     `json:"vendors"`
	Policies   []ExportRow     `json:"policies"`
	Agents     []ExportRow     `json:"agents"`
	Incidents  []ExportRow     `json:"incidents"`
}

// ExportRow is a generic row that carries raw JSON for any table record.
type ExportRow map[string]any

// ExportService handles data export and import operations.
type ExportService struct {
	db *store.DB
}

// NewExportService creates an ExportService.
func NewExportService(db *store.DB) *ExportService {
	return &ExportService{db: db}
}

// ExportOrg builds a full JSON export of org data.
func (s *ExportService) ExportOrg(ctx context.Context, orgID string) (*OrgExport, error) {
	exp := &OrgExport{
		ExportedAt: time.Now().UTC().Format(time.RFC3339),
		OrgID:      orgID,
	}

	var err error
	exp.Assets, err = s.queryRows(ctx,
		`SELECT id::text, name, asset_type, status, description, created_at::text
		 FROM assets WHERE org_id=$1 ORDER BY name`, orgID,
		"id", "name", "asset_type", "status", "description", "created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("export assets: %w", err)
	}

	exp.Vendors, err = s.queryRows(ctx,
		`SELECT id::text, name, vendor_type, status, risk_tier, created_at::text
		 FROM vendors WHERE org_id=$1 ORDER BY name`, orgID,
		"id", "name", "vendor_type", "status", "risk_tier", "created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("export vendors: %w", err)
	}

	exp.Policies, err = s.queryRows(ctx,
		`SELECT id::text, title, status, version, created_at::text
		 FROM policies WHERE org_id=$1 ORDER BY title`, orgID,
		"id", "title", "status", "version", "created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("export policies: %w", err)
	}

	exp.Agents, err = s.queryRows(ctx,
		`SELECT id::text, name, agent_type, status, created_at::text
		 FROM agents WHERE org_id=$1 ORDER BY name`, orgID,
		"id", "name", "agent_type", "status", "created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("export agents: %w", err)
	}

	exp.Incidents, err = s.queryRows(ctx,
		`SELECT id::text, title, status, severity, created_at::text
		 FROM incidents WHERE org_id=$1 ORDER BY created_at DESC`, orgID,
		"id", "title", "status", "severity", "created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("export incidents: %w", err)
	}

	return exp, nil
}

func (s *ExportService) queryRows(ctx context.Context, query, orgID string, cols ...string) ([]ExportRow, error) {
	rows, err := s.db.Pool().Query(ctx, query, orgID)
	if err != nil {
		return []ExportRow{}, nil // non-fatal: table may not exist yet
	}
	defer rows.Close()

	var out []ExportRow
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}
		row := make(ExportRow, len(cols))
		for i, col := range cols {
			row[col] = vals[i]
		}
		out = append(out, row)
	}
	if out == nil {
		out = []ExportRow{}
	}
	return out, rows.Err()
}

// ExportAssetsCSV writes all assets for an org as CSV.
func (s *ExportService) ExportAssetsCSV(ctx context.Context, orgID string, w io.Writer) error {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id::text, name, asset_type, status, COALESCE(description,''), created_at::text
		 FROM assets WHERE org_id=$1 ORDER BY name`,
		orgID,
	)
	if err != nil {
		return fmt.Errorf("query assets: %w", err)
	}
	defer rows.Close()

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"id", "name", "asset_type", "status", "description", "created_at"})
	for rows.Next() {
		var id, name, assetType, status, desc, createdAt string
		if err := rows.Scan(&id, &name, &assetType, &status, &desc, &createdAt); err != nil {
			return err
		}
		_ = cw.Write([]string{id, name, assetType, status, desc, createdAt})
	}
	cw.Flush()
	return cw.Error()
}

// ImportResult summarises the outcome of a bulk import.
type ImportResult struct {
	Created int      `json:"created"`
	Skipped int      `json:"skipped"`
	Errors  []string `json:"errors,omitempty"`
}

// ImportAssetRow is one row in a bulk asset import payload.
type ImportAssetRow struct {
	Name        string `json:"name"`
	AssetType   string `json:"asset_type"`
	Description string `json:"description"`
}

// ImportAssets bulk-inserts assets, skipping duplicates (same name in org).
func (s *ExportService) ImportAssets(ctx context.Context, orgID string, rows []ImportAssetRow) (*ImportResult, error) {
	result := &ImportResult{}
	for _, row := range rows {
		if row.Name == "" {
			result.Errors = append(result.Errors, "row missing name")
			result.Skipped++
			continue
		}
		assetType := row.AssetType
		if assetType == "" {
			assetType = "other"
		}
		tag, err := s.db.Pool().Exec(ctx,
			`INSERT INTO assets (org_id, name, asset_type, status, description)
			 VALUES ($1, $2, $3, 'active', $4)
			 ON CONFLICT DO NOTHING`,
			orgID, row.Name, assetType, row.Description,
		)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", row.Name, err))
			result.Skipped++
			continue
		}
		if tag.RowsAffected() == 0 {
			result.Skipped++
		} else {
			result.Created++
		}
	}
	return result, nil
}

// ImportVendorRow is one row in a bulk vendor import payload.
type ImportVendorRow struct {
	Name       string `json:"name"`
	VendorType string `json:"vendor_type"`
	Website    string `json:"website"`
}

// ImportVendors bulk-inserts vendors, skipping duplicates.
func (s *ExportService) ImportVendors(ctx context.Context, orgID string, rows []ImportVendorRow) (*ImportResult, error) {
	result := &ImportResult{}
	for _, row := range rows {
		if row.Name == "" {
			result.Errors = append(result.Errors, "row missing name")
			result.Skipped++
			continue
		}
		vt := row.VendorType
		if vt == "" {
			vt = "tools"
		}
		tag, err := s.db.Pool().Exec(ctx,
			`INSERT INTO vendors (org_id, name, vendor_type, status, website)
			 VALUES ($1, $2, $3, 'active', $4)
			 ON CONFLICT DO NOTHING`,
			orgID, row.Name, vt, row.Website,
		)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", row.Name, err))
			result.Skipped++
			continue
		}
		if tag.RowsAffected() == 0 {
			result.Skipped++
		} else {
			result.Created++
		}
	}
	return result, nil
}

// ExportJSON is a helper that marshals v to JSON bytes.
func ExportJSON(v any) ([]byte, error) {
	return json.MarshalIndent(v, "", "  ")
}
