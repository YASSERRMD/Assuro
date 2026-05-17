package domain

// AISystemDetails holds AI-specific fields for an asset.
type AISystemDetails struct {
	Provider            string
	ModelFamily         string
	Modality            string
	DeploymentContext   string
	DataSources         []string
	IntendedPurpose     string
	AffectedPopulations []string
	EUMarketExposure    bool
	IsAgentic           bool
	AutonomyLevel       int32
	LifecycleStage      string
}

// AISystem is an asset of type ai_system with additional details.
type AISystem struct {
	Asset   Asset
	Details AISystemDetails
}

// Validate checks that the AI system has required fields.
func (a *AISystem) Validate() error {
	if err := a.Asset.Validate(); err != nil {
		return err
	}
	if a.Asset.AssetType != AssetTypeAISystem {
		return errInvalidAssetType
	}
	return nil
}

var errInvalidAssetType = &ValidationError{Field: "asset_type", Message: "must be ai_system"}

// ValidationError is a domain validation error.
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + ": " + e.Message
}
