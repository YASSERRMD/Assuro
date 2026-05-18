package api

import (
	"encoding/json"
	"net/http"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/service"
	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
)

// RBACHandler handles RBAC role and permission endpoints.
type RBACHandler struct {
	svc    *service.RBACService
	logger *zap.Logger
}

// NewRBACHandler creates an RBACHandler.
func NewRBACHandler(svc *service.RBACService, logger *zap.Logger) *RBACHandler {
	return &RBACHandler{svc: svc, logger: logger}
}

// ListPermissions handles GET /v1/roles/permissions — returns all known permission strings.
func (h *RBACHandler) ListPermissions(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, service.KnownPermissions())
}

// ListRoles handles GET /v1/roles.
func (h *RBACHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	roles, err := h.svc.ListRoles(r.Context(), p.OrgID)
	if err != nil {
		h.logger.Error("list roles", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list roles")
		return
	}
	writeJSON(w, http.StatusOK, roles)
}

// CreateRole handles POST /v1/roles.
func (h *RBACHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "name is required")
		return
	}
	role, err := h.svc.CreateRole(r.Context(), p.OrgID, body.Name, body.Description)
	if err != nil {
		h.logger.Error("create role", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to create role")
		return
	}
	writeJSON(w, http.StatusCreated, role)
}

// DeleteRole handles DELETE /v1/roles/{id}.
func (h *RBACHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	if err := h.svc.DeleteRole(r.Context(), chi.URLParam(r, "id"), p.OrgID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to delete role")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetRolePermissions handles GET /v1/roles/{id}/permissions.
func (h *RBACHandler) GetRolePermissions(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	perms, err := h.svc.ListPermissions(r.Context(), chi.URLParam(r, "id"), p.OrgID)
	if err != nil {
		h.logger.Error("list role permissions", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list permissions")
		return
	}
	writeJSON(w, http.StatusOK, perms)
}

// GrantRolePermission handles POST /v1/roles/{id}/permissions.
func (h *RBACHandler) GrantRolePermission(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	var body struct {
		Permission string `json:"permission"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Permission == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "permission is required")
		return
	}
	if err := h.svc.GrantPermission(r.Context(), chi.URLParam(r, "id"), p.OrgID, body.Permission); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to grant permission")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// RevokeRolePermission handles DELETE /v1/roles/{id}/permissions/{permission}.
func (h *RBACHandler) RevokeRolePermission(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	if err := h.svc.RevokePermission(r.Context(), chi.URLParam(r, "id"), p.OrgID, chi.URLParam(r, "permission")); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to revoke permission")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListUserRoles handles GET /v1/users/{id}/roles.
func (h *RBACHandler) ListUserRoles(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	roles, err := h.svc.ListUserRoles(r.Context(), chi.URLParam(r, "id"), p.OrgID)
	if err != nil {
		h.logger.Error("list user roles", zap.Error(err))
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to list user roles")
		return
	}
	writeJSON(w, http.StatusOK, roles)
}

// AssignUserRole handles POST /v1/users/{id}/roles.
func (h *RBACHandler) AssignUserRole(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	var body struct {
		RoleID string `json:"role_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RoleID == "" {
		WriteError(w, http.StatusBadRequest, "invalid_request", "role_id is required")
		return
	}
	if err := h.svc.AssignRole(r.Context(), chi.URLParam(r, "id"), p.OrgID, body.RoleID, p.UserID); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to assign role")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// RemoveUserRole handles DELETE /v1/users/{id}/roles/{role_id}.
func (h *RBACHandler) RemoveUserRole(w http.ResponseWriter, r *http.Request) {
	p, ok := auth.PrincipalFromContext(r.Context())
	if !ok {
		WriteError(w, http.StatusUnauthorized, "unauthenticated", "not authenticated")
		return
	}
	if p.Role != "owner" && p.Role != "admin" {
		WriteError(w, http.StatusForbidden, "forbidden", "admin or owner role required")
		return
	}
	if err := h.svc.RemoveRole(r.Context(), chi.URLParam(r, "id"), p.OrgID, chi.URLParam(r, "role_id")); err != nil {
		WriteError(w, http.StatusInternalServerError, "internal_error", "failed to remove role")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
