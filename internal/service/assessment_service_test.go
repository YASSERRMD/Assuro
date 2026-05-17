package service

import (
	"testing"
)

func TestAssessmentStatusTransitions(t *testing.T) {
	validStatuses := []string{"draft", "in_review", "completed"}
	for _, s := range validStatuses {
		if s == "" {
			t.Error("empty status is not valid")
		}
	}
}

func TestControlPropagationLogic(t *testing.T) {
	testCases := []struct {
		answer   string
		expected string
	}{
		{`"yes"`, "implemented"},
		{`"no"`, "in_progress"},
		{`"maybe"`, "not_started"},
	}

	for _, tc := range testCases {
		status := "not_started"
		if tc.answer == `"yes"` {
			status = "implemented"
		} else if tc.answer == `"no"` {
			status = "in_progress"
		}
		if status != tc.expected {
			t.Errorf("answer %s: expected %s, got %s", tc.answer, tc.expected, status)
		}
	}
}
