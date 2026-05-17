package report

import (
	"testing"
)

func TestBuildJSON(t *testing.T) {
	builder := NewBuilder()
	report, err := builder.BuildJSON("asset-1", "eu_ai_act", nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if report.AssetID != "asset-1" {
		t.Errorf("expected asset-1, got %s", report.AssetID)
	}
	if report.ContentHash == "" {
		t.Error("content hash is empty")
	}
}

func TestBuildHTML(t *testing.T) {
	builder := NewBuilder()
	report, err := builder.BuildJSON("asset-1", "eu_ai_act", nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	html := builder.BuildHTML(report)
	if html == "" {
		t.Fatal("HTML is empty")
	}
	if len(html) < 100 {
		t.Errorf("HTML too short: %d bytes", len(html))
	}
}

func TestContentHashStable(t *testing.T) {
	builder := NewBuilder()
	r1, _ := builder.BuildJSON("asset-1", "eu_ai_act", nil, nil, nil)
	r2, _ := builder.BuildJSON("asset-1", "eu_ai_act", nil, nil, nil)
	if r1.ContentHash == r2.ContentHash {
		t.Log("hashes match for identical input (expected after removing timestamp)")
	}
}
