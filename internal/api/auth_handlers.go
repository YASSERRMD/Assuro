package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/service"
	"go.uber.org/zap"
)

// AuthHandler handles auth HTTP requests.
type AuthHandler struct {
	svc    *service.AuthService
	logger *zap.Logger
}

// NewAuthHandler creates a new auth handler.
func NewAuthHandler(svc *service.AuthService, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{svc: svc, logger: logger}
}

type signupRequest struct {
	OrgName  string `json:"org_name"`
	OrgSlug  string `json:"org_slug"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// SignUp handles POST /v1/auth/signup.
func (h *AuthHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.OrgName == "" || req.OrgSlug == "" || req.Email == "" || req.Password == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "all fields are required")
		return
	}

	tokens, err := h.svc.SignUp(r.Context(), service.SignUpInput{
		OrgName:  req.OrgName,
		OrgSlug:  req.OrgSlug,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		h.logger.Error("signup failed", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "signup failed")
		return
	}

	writeJSON(w, http.StatusCreated, tokens)
}

// LoginRequest contains login request fields.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login handles POST /v1/auth/login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.Email == "" || req.Password == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "email and password are required")
		return
	}

	tokens, err := h.svc.Login(r.Context(), service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		h.logger.Error("login failed", zap.Error(err))
		WriteError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Refresh handles POST /v1/auth/refresh.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
		return
	}

	if req.RefreshToken == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "refresh_token is required")
		return
	}

	tokens, err := h.svc.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		h.logger.Error("refresh failed", zap.Error(err))
		WriteError(w, http.StatusUnauthorized, "invalid_token", "invalid or expired refresh token")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}
