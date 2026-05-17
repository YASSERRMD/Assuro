package service

import (
	"context"
	"fmt"
	"time"

	"github.com/YASSERRMD/Assuro/internal/auth"
	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
)

// AuthService handles authentication operations.
type AuthService struct {
	db      *store.DB
	queries *qgen.Queries
	cfg     *AuthConfig
}

// AuthConfig holds auth service configuration.
type AuthConfig struct {
	JWTSecret     string
	JWTAccessTTL  string
	JWTRefreshTTL string
}

// NewAuthService creates a new auth service.
func NewAuthService(db *store.DB, cfg *AuthConfig) *AuthService {
	return &AuthService{
		db:      db,
		queries: qgen.New(db.Pool()),
		cfg:     cfg,
	}
}

// SignUpInput contains signup request fields.
type SignUpInput struct {
	OrgName  string
	OrgSlug  string
	Email    string
	Password string
}

// SignUp creates an organization and its first owner user.
func (s *AuthService) SignUp(ctx context.Context, in SignUpInput) (*auth.TokenPair, error) {
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	org, err := qtx.CreateOrganization(ctx, qgen.CreateOrganizationParams{
		Name: in.OrgName,
		Slug: in.OrgSlug,
	})
	if err != nil {
		return nil, fmt.Errorf("create org: %w", err)
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := qtx.CreateUser(ctx, qgen.CreateUserParams{
		OrgID:        org.ID,
		Email:        in.Email,
		PasswordHash: hash,
		Role:         "owner",
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	payload := []byte(`{"email":"` + in.Email + `","org":"` + in.OrgSlug + `"}`)
	_, err = qtx.CreateAuditLog(ctx, qgen.CreateAuditLogParams{
		OrgID:       org.ID,
		ActorUserID: user.ID,
		Action:      "user.signup",
		TargetType:  "user",
		TargetID:    user.ID,
		Payload:     payload,
	})
	if err != nil {
		return nil, fmt.Errorf("write audit log: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	accessTTL, _ := time.ParseDuration(s.cfg.JWTAccessTTL)
	refreshTTL, _ := time.ParseDuration(s.cfg.JWTRefreshTTL)

	tokens, err := auth.GenerateTokens(
		user.ID.String(), org.ID.String(), user.Role,
		s.cfg.JWTSecret, accessTTL, refreshTTL,
	)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	return tokens, nil
}

// LoginInput contains login request fields.
type LoginInput struct {
	Email    string
	Password string
}

// Login verifies credentials and issues token pair.
func (s *AuthService) Login(ctx context.Context, in LoginInput) (*auth.TokenPair, error) {
	user, err := s.queries.GetUserByEmail(ctx, in.Email)
	if err != nil {
		return nil, fmt.Errorf("lookup user: %w", err)
	}

	match, err := auth.ComparePassword(user.PasswordHash, in.Password)
	if err != nil {
		return nil, fmt.Errorf("compare password: %w", err)
	}
	if !match {
		return nil, fmt.Errorf("invalid credentials")
	}

	accessTTL, _ := time.ParseDuration(s.cfg.JWTAccessTTL)
	refreshTTL, _ := time.ParseDuration(s.cfg.JWTRefreshTTL)

	tokens, err := auth.GenerateTokens(
		user.ID.String(), user.OrgID.String(), user.Role,
		s.cfg.JWTSecret, accessTTL, refreshTTL,
	)
	if err != nil {
		return nil, fmt.Errorf("generate tokens: %w", err)
	}

	return tokens, nil
}
