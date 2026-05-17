package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const principalKey contextKey = "principal"

// Principal represents an authenticated user.
type Principal struct {
	UserID string
	OrgID  string
	Role   string
}

// RequireAuth validates the bearer token and puts the principal in context.
func RequireAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" {
				http.Error(w, `{"code":"unauthenticated","message":"missing token"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(auth, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, `{"code":"unauthenticated","message":"invalid token format"}`, http.StatusUnauthorized)
				return
			}

			claims, err := VerifyToken(parts[1], secret)
			if err != nil {
				http.Error(w, `{"code":"unauthenticated","message":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			principal := Principal{
				UserID: claims.UserID,
				OrgID:  claims.OrgID,
				Role:   claims.Role,
			}

			ctx := context.WithValue(r.Context(), principalKey, principal)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole authorizes by role.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			p, ok := r.Context().Value(principalKey).(Principal)
			if !ok {
				http.Error(w, `{"code":"unauthenticated","message":"not authenticated"}`, http.StatusUnauthorized)
				return
			}

			if !allowed[p.Role] {
				http.Error(w, `{"code":"forbidden","message":"insufficient permissions"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// PrincipalFromContext extracts the principal from the request context.
func PrincipalFromContext(ctx context.Context) (Principal, bool) {
	p, ok := ctx.Value(principalKey).(Principal)
	return p, ok
}
