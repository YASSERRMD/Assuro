package jobs

import (
	"context"
	"encoding/json"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

// memQueue is an in-memory Queue for testing.
type memQueue struct {
	jobs   []*Job
	nextID int64
}

func (m *memQueue) Enqueue(_ context.Context, p EnqueueParams) (*Job, error) {
	m.nextID++
	raw, _ := json.Marshal(p.Payload)
	j := &Job{
		ID:          string(rune('A' + m.nextID)),
		Kind:        p.Kind,
		Payload:     raw,
		Status:      StatusPending,
		MaxAttempts: 3,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	m.jobs = append(m.jobs, j)
	return j, nil
}

func (m *memQueue) Dequeue(_ context.Context, _ string, _ []string) (*Job, error) {
	for _, j := range m.jobs {
		if j.Status == StatusPending {
			j.Status = StatusRunning
			j.Attempts++
			return j, nil
		}
	}
	return nil, nil
}

func (m *memQueue) Ack(_ context.Context, id string) error {
	for _, j := range m.jobs {
		if j.ID == id {
			j.Status = StatusSucceeded
		}
	}
	return nil
}

func (m *memQueue) Fail(_ context.Context, id string, errMsg string) error {
	for _, j := range m.jobs {
		if j.ID == id {
			j.LastError = errMsg
			if j.Attempts >= j.MaxAttempts {
				j.Status = StatusDead
			} else {
				j.Status = StatusPending
			}
		}
	}
	return nil
}

func (m *memQueue) List(_ context.Context, _ string, _ int) ([]Job, error) {
	out := make([]Job, len(m.jobs))
	for i, j := range m.jobs {
		out[i] = *j
	}
	return out, nil
}

func (m *memQueue) Get(_ context.Context, id string) (*Job, error) {
	for _, j := range m.jobs {
		if j.ID == id {
			return j, nil
		}
	}
	return nil, nil
}

func TestWorker_DispatchesJob(t *testing.T) {
	q := &memQueue{}
	reg := NewRegistry()

	var count atomic.Int32
	reg.Register("test.count", func(_ context.Context, _ json.RawMessage) error {
		count.Add(1)
		return nil
	})

	_, err := q.Enqueue(context.Background(), EnqueueParams{Kind: "test.count", Payload: nil})
	if err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	w := NewWorker(q, reg, WorkerConfig{Concurrency: 1, PollInterval: 10 * time.Millisecond}, nil)
	w.logger = newNopLogger()
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	w.Start(ctx)
	<-ctx.Done()
	w.Stop()

	if count.Load() == 0 {
		t.Error("expected handler to be called at least once")
	}
}

func TestWorker_FailsJobOnHandlerError(t *testing.T) {
	q := &memQueue{}
	reg := NewRegistry()
	reg.Register("test.fail", func(_ context.Context, _ json.RawMessage) error {
		return errors.New("boom")
	})

	_, err := q.Enqueue(context.Background(), EnqueueParams{Kind: "test.fail", Payload: nil})
	if err != nil {
		t.Fatalf("enqueue: %v", err)
	}
	job := q.jobs[0]
	job.MaxAttempts = 1 // ensure it goes dead on first failure

	w := NewWorker(q, reg, WorkerConfig{Concurrency: 1, PollInterval: 10 * time.Millisecond}, nil)
	w.logger = newNopLogger()
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	w.Start(ctx)
	<-ctx.Done()
	w.Stop()

	if q.jobs[0].Status != StatusDead {
		t.Errorf("expected job status dead, got %s", q.jobs[0].Status)
	}
}

func TestWorker_NoHandlerFails(t *testing.T) {
	q := &memQueue{}
	reg := NewRegistry()

	_, _ = q.Enqueue(context.Background(), EnqueueParams{Kind: "unknown.kind", Payload: nil})
	q.jobs[0].MaxAttempts = 1

	w := NewWorker(q, reg, WorkerConfig{Concurrency: 1, PollInterval: 10 * time.Millisecond}, nil)
	w.logger = newNopLogger()
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	w.Start(ctx)
	<-ctx.Done()
	w.Stop()

	if q.jobs[0].LastError == "" {
		t.Error("expected last_error to be set for unknown kind")
	}
}
