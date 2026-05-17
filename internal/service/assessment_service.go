package service

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
	qgen "github.com/YASSERRMD/Assuro/internal/store/queries/generated"
	"github.com/jackc/pgx/v5/pgtype"
)

// AssessmentService handles assessment operations.
type AssessmentService struct {
	db      *store.DB
	queries *qgen.Queries
	fwSvc   *FrameworkService
}

// NewAssessmentService creates a new assessment service.
func NewAssessmentService(db *store.DB, fwSvc *FrameworkService) *AssessmentService {
	return &AssessmentService{
		db:      db,
		queries: qgen.New(db.Pool()),
		fwSvc:   fwSvc,
	}
}

// CreateAssessmentInput contains assessment creation fields.
type CreateAssessmentInput struct {
	OrgID      string
	AssetID    string
	TemplateID string
	StartedBy  string
}

// CreateAssessment creates a new assessment instance.
func (s *AssessmentService) CreateAssessment(ctx context.Context, in CreateAssessmentInput) (*qgen.Assessment, error) {
	orgID := parseUUID(in.OrgID)
	assetID := parseUUID(in.AssetID)
	templateID := parseUUID(in.TemplateID)
	startedBy := parseUUID(in.StartedBy)

	assessment, err := s.queries.CreateAssessment(ctx, qgen.CreateAssessmentParams{
		OrgID:      orgID,
		AssetID:    assetID,
		TemplateID: templateID,
		StartedBy:  startedBy,
	})
	if err != nil {
		return nil, fmt.Errorf("create assessment: %w", err)
	}

	return &assessment, nil
}

// SaveResponseInput contains response fields.
type SaveResponseInput struct {
	AssessmentID string
	QuestionID   string
	Answer       []byte
	AnsweredBy   string
	Note         string
}

// SaveResponse saves or updates a response for a question.
func (s *AssessmentService) SaveResponse(ctx context.Context, in SaveResponseInput) (*qgen.AssessmentResponse, error) {
	aID := parseUUID(in.AssessmentID)
	qID := parseUUID(in.QuestionID)
	uID := pgtype.UUID{}
	if in.AnsweredBy != "" {
		uID = parseUUID(in.AnsweredBy)
	}

	resp, err := s.queries.SaveResponse(ctx, qgen.SaveResponseParams{
		AssessmentID: aID,
		QuestionID:   qID,
		Answer:       in.Answer,
		AnsweredBy:   uID,
		Note:         pgtype.Text{String: in.Note, Valid: in.Note != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("save response: %w", err)
	}

	return &resp, nil
}

// SubmitAssessment validates and completes an assessment, propagating control statuses.
func (s *AssessmentService) SubmitAssessment(ctx context.Context, orgID, assessmentID string) error {
	oID := parseUUID(orgID)
	aID := parseUUID(assessmentID)

	assessment, err := s.queries.GetAssessmentByIDAndOrg(ctx, qgen.GetAssessmentByIDAndOrgParams{
		ID:    aID,
		OrgID: oID,
	})
	if err != nil {
		return fmt.Errorf("get assessment: %w", err)
	}

	requiredCount, err := s.queries.CountRequiredQuestionsByTemplate(ctx, assessment.TemplateID)
	if err != nil {
		return fmt.Errorf("count required questions: %w", err)
	}

	responseCount, err := s.queries.CountResponsesByAssessment(ctx, aID)
	if err != nil {
		return fmt.Errorf("count responses: %w", err)
	}

	if responseCount < requiredCount {
		return fmt.Errorf("missing %d required responses", requiredCount-responseCount)
	}

	_, err = s.queries.CompleteAssessment(ctx, qgen.CompleteAssessmentParams{
		ID:    aID,
		OrgID: oID,
	})
	if err != nil {
		return fmt.Errorf("complete assessment: %w", err)
	}

	return s.propagateControlStatuses(ctx, aID, assessment.AssetID)
}

func (s *AssessmentService) propagateControlStatuses(ctx context.Context, assessmentID, assetID pgtype.UUID) error {
	responses, err := s.queries.GetResponsesByAssessment(ctx, assessmentID)
	if err != nil {
		return fmt.Errorf("get responses: %w", err)
	}

	for _, resp := range responses {
		question, err := s.queries.GetQuestionsByTemplate(ctx, resp.QuestionID)
		if err != nil {
			continue
		}
		if len(question) == 0 {
			continue
		}
		q := question[0]
		if !q.ControlID.Valid {
			continue
		}

		status := "not_started"
		if len(resp.Answer) > 0 && string(resp.Answer) == `"yes"` {
			status = "implemented"
		} else if len(resp.Answer) > 0 && string(resp.Answer) == `"no"` {
			status = "in_progress"
		}

		_, _ = s.queries.SetControlStatus(ctx, qgen.SetControlStatusParams{
			AssetID:   assetID,
			ControlID: q.ControlID,
			Status:    status,
		})
	}

	return nil
}

// GetAssessment returns an assessment with its questions and responses.
func (s *AssessmentService) GetAssessment(ctx context.Context, orgID, assessmentID string) (*qgen.Assessment, error) {
	oID := parseUUID(orgID)
	aID := parseUUID(assessmentID)

	assessment, err := s.queries.GetAssessmentByIDAndOrg(ctx, qgen.GetAssessmentByIDAndOrgParams{
		ID:    aID,
		OrgID: oID,
	})
	if err != nil {
		return nil, fmt.Errorf("get assessment: %w", err)
	}

	return &assessment, nil
}

// ListAssessmentsByOrg returns assessments for an organization.
func (s *AssessmentService) ListAssessmentsByOrg(ctx context.Context, orgID string, limit, offset int32) ([]qgen.Assessment, error) {
	oID := parseUUID(orgID)

	assessments, err := s.queries.ListAssessmentsByOrg(ctx, qgen.ListAssessmentsByOrgParams{
		OrgID:  oID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("list assessments: %w", err)
	}

	return assessments, nil
}

// GetTemplateByKey returns a built-in template by key.
func (s *AssessmentService) GetTemplateByKey(ctx context.Context, key string) (*qgen.AssessmentTemplate, error) {
	template, err := s.queries.GetTemplateByKey(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("get template: %w", err)
	}

	return &template, nil
}

// GetQuestionsByTemplate returns all questions for a template.
func (s *AssessmentService) GetQuestionsByTemplate(ctx context.Context, templateID string) ([]qgen.TemplateQuestion, error) {
	tID := parseUUID(templateID)

	questions, err := s.queries.GetQuestionsByTemplate(ctx, tID)
	if err != nil {
		return nil, fmt.Errorf("get questions: %w", err)
	}

	return questions, nil
}
