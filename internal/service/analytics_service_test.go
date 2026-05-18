package service

import "testing"

func TestAnalyticsDashboardFields(t *testing.T) {
	dash := AnalyticsDashboard{}
	if dash.IncidentTrends != nil {
		t.Error("incident trends should be nil before init")
	}
}

func TestRiskSummaryZeroValue(t *testing.T) {
	r := RiskSummary{}
	if r.Total != 0 {
		t.Error("zero value total should be 0")
	}
}
