package api

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter provides per-IP rate limiting.
type RateLimiter struct {
	clients map[string]*client
	mu      sync.Mutex
	limit   int
	window  time.Duration
}

type client struct {
	count    int
	resetAt  time.Time
}

// NewRateLimiter creates a rate limiter.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		clients: make(map[string]*client),
		limit:   limit,
		window:  window,
	}
}

// Middleware returns an HTTP middleware that rate limits requests.
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr

		rl.mu.Lock()
		c, ok := rl.clients[ip]
		if !ok || time.Now().After(c.resetAt) {
			rl.clients[ip] = &client{count: 1, resetAt: time.Now().Add(rl.window)}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		c.count++
		rl.mu.Unlock()

		if c.count > rl.limit {
			http.Error(w, `{"code":"rate_limited","message":"too many requests"}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
