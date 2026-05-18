package service

import (
	"context"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/store"
)

// Task is a work item for remediation, review, or investigation.
type Task struct {
	ID           string  `json:"id"`
	OrgID        string  `json:"org_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description,omitempty"`
	TaskType     string  `json:"task_type"`
	Status       string  `json:"status"`
	Priority     string  `json:"priority"`
	ResourceType string  `json:"resource_type,omitempty"`
	ResourceID   string  `json:"resource_id,omitempty"`
	AssigneeID   *string `json:"assignee_id,omitempty"`
	DueDate      *string `json:"due_date,omitempty"`
	CompletedAt  *string `json:"completed_at,omitempty"`
	CreatedBy    *string `json:"created_by,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// TaskComment is a comment on a task.
type TaskComment struct {
	ID        string `json:"id"`
	TaskID    string `json:"task_id"`
	OrgID     string `json:"org_id"`
	UserID    string `json:"user_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

// TaskService manages tasks and comments.
type TaskService struct {
	db *store.DB
}

// NewTaskService creates a TaskService.
func NewTaskService(db *store.DB) *TaskService {
	return &TaskService{db: db}
}

// CreateTask creates a new task.
func (s *TaskService) CreateTask(ctx context.Context, t Task) (*Task, error) {
	if t.TaskType == "" {
		t.TaskType = "remediation"
	}
	if t.Priority == "" {
		t.Priority = "medium"
	}
	var id, createdAt, updatedAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO tasks
		   (org_id, title, description, task_type, priority, resource_type, resource_id,
		    assignee_id, due_date, created_by)
		 VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),NULLIF($7,''),NULLIF($8,'')::uuid,
		         NULLIF($9,'')::date,NULLIF($10,'')::uuid)
		 RETURNING id, created_at::text, updated_at::text`,
		t.OrgID, t.Title, t.Description, t.TaskType, t.Priority,
		t.ResourceType, t.ResourceID, derefStr(t.AssigneeID), derefStr(t.DueDate), derefStr(t.CreatedBy),
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	t.ID = id
	t.Status = "open"
	t.CreatedAt = createdAt
	t.UpdatedAt = updatedAt
	return &t, nil
}

// ListTasks returns tasks for an org.
func (s *TaskService) ListTasks(ctx context.Context, orgID, status, priority, assigneeID, resourceType, resourceID string) ([]Task, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT id, org_id, title, COALESCE(description,''), task_type, status, priority,
		        COALESCE(resource_type,''), COALESCE(resource_id,''),
		        assignee_id::text, due_date::text, completed_at::text,
		        created_by::text, created_at::text, updated_at::text
		 FROM tasks
		 WHERE org_id=$1
		   AND ($2='' OR status=$2)
		   AND ($3='' OR priority=$3)
		   AND ($4='' OR assignee_id::text=$4)
		   AND ($5='' OR resource_type=$5)
		   AND ($6='' OR resource_id=$6)
		 ORDER BY
		   CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
		   created_at DESC`,
		orgID, status, priority, assigneeID, resourceType, resourceID,
	)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	var out []Task
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.OrgID, &t.Title, &t.Description, &t.TaskType, &t.Status,
			&t.Priority, &t.ResourceType, &t.ResourceID, &t.AssigneeID, &t.DueDate,
			&t.CompletedAt, &t.CreatedBy, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// UpdateTaskStatus changes the status of a task.
func (s *TaskService) UpdateTaskStatus(ctx context.Context, id, orgID, status string) error {
	q := `UPDATE tasks SET status=$1, updated_at=now() WHERE id=$2 AND org_id=$3`
	args := []any{status, id, orgID}
	if status == "done" {
		q = `UPDATE tasks SET status=$1, completed_at=now(), updated_at=now() WHERE id=$2 AND org_id=$3`
	}
	_, err := s.db.Pool().Exec(ctx, q, args...)
	return err
}

// AssignTask changes the assignee of a task.
func (s *TaskService) AssignTask(ctx context.Context, id, orgID, assigneeID string) error {
	_, err := s.db.Pool().Exec(ctx,
		`UPDATE tasks SET assignee_id=NULLIF($1,'')::uuid, updated_at=now() WHERE id=$2 AND org_id=$3`,
		assigneeID, id, orgID,
	)
	return err
}

// AddComment adds a comment to a task.
func (s *TaskService) AddComment(ctx context.Context, c TaskComment) (*TaskComment, error) {
	var id, createdAt string
	err := s.db.Pool().QueryRow(ctx,
		`INSERT INTO task_comments (task_id, org_id, user_id, body)
		 VALUES ($1,$2,$3,$4)
		 RETURNING id, created_at::text`,
		c.TaskID, c.OrgID, c.UserID, c.Body,
	).Scan(&id, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("add comment: %w", err)
	}
	c.ID = id
	c.CreatedAt = createdAt
	return &c, nil
}

// ListComments returns comments for a task.
func (s *TaskService) ListComments(ctx context.Context, taskID, orgID string) ([]TaskComment, error) {
	rows, err := s.db.Pool().Query(ctx,
		`SELECT tc.id, tc.task_id, tc.org_id, tc.user_id, tc.body, tc.created_at::text
		 FROM task_comments tc
		 JOIN tasks t ON t.id=tc.task_id
		 WHERE tc.task_id=$1 AND t.org_id=$2
		 ORDER BY tc.created_at`,
		taskID, orgID,
	)
	if err != nil {
		return nil, fmt.Errorf("list comments: %w", err)
	}
	defer rows.Close()

	var out []TaskComment
	for rows.Next() {
		var c TaskComment
		if err := rows.Scan(&c.ID, &c.TaskID, &c.OrgID, &c.UserID, &c.Body, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
