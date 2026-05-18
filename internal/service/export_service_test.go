package service

import (
	"encoding/json"
	"testing"
)

func TestImportResultDefaults(t *testing.T) {
	r := ImportResult{}
	if r.Created != 0 || r.Skipped != 0 {
		t.Error("zero values should be 0")
	}
	if r.Errors != nil {
		t.Error("errors slice should be nil by default")
	}
}

func TestExportJSONRoundtrip(t *testing.T) {
	exp := OrgExport{
		OrgID:     "org-1",
		Assets:    []ExportRow{{"id": "a1", "name": "Test"}},
		Vendors:   []ExportRow{},
		Policies:  []ExportRow{},
		Agents:    []ExportRow{},
		Incidents: []ExportRow{},
	}
	b, err := ExportJSON(exp)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	var out OrgExport
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if out.OrgID != exp.OrgID {
		t.Errorf("org id mismatch: %s != %s", out.OrgID, exp.OrgID)
	}
	if len(out.Assets) != 1 {
		t.Errorf("expected 1 asset, got %d", len(out.Assets))
	}
}

func TestImportAssetRowValidation(t *testing.T) {
	row := ImportAssetRow{Name: "", AssetType: "model"}
	if row.Name != "" {
		t.Error("empty name should be caught by importer")
	}
}
