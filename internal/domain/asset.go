package domain

import (
	"fmt"
	"strings"
)

// AssetType represents the type of an asset.
type AssetType string

const (
	AssetTypeAISystem AssetType = "ai_system"
)

// LifecycleStatus represents the lifecycle state of an asset.
type LifecycleStatus string

const (
	LifecycleStatusActive    LifecycleStatus = "active"
	LifecycleStatusArchived  LifecycleStatus = "archived"
	LifecycleStatusInactive  LifecycleStatus = "inactive"
)

// Asset represents a generic inventory item.
type Asset struct {
	ID             string
	OrgID          string
	AssetType      AssetType
	Name           string
	Description    string
	OwnerUserID    string
	Metadata       map[string]any
	LifecycleStatus LifecycleStatus
}

// Validate checks that the asset has required fields.
func (a *Asset) Validate() error {
	var errs []string

	if strings.TrimSpace(a.Name) == "" {
		errs = append(errs, "name is required")
	}
	if len(a.Name) > 255 {
		errs = append(errs, "name must be 255 characters or less")
	}
	if a.AssetType == "" {
		errs = append(errs, "asset_type is required")
	}
	if a.LifecycleStatus == "" {
		a.LifecycleStatus = LifecycleStatusActive
	}

	if len(errs) > 0 {
		return fmt.Errorf("validation failed: %s", strings.Join(errs, "; "))
	}
	return nil
}
