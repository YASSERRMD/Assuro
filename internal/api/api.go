package api

import (
	"net/http"
	"strconv"
)

// intQuery reads an integer query parameter, returning def if absent or invalid.
func intQuery(r *http.Request, key string, def int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil || v < 0 {
		return def
	}
	return v
}
