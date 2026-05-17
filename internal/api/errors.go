package api

import (
	"encoding/json"
	"net/http"
)

// ErrorResponse is the standard JSON error envelope.
type ErrorResponse struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Details []string `json:"details,omitempty"`
}

// WriteError writes a standard error response.
func WriteError(w http.ResponseWriter, status int, code, message string, details ...string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	})
}
