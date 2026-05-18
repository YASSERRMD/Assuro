package jobs

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"go.uber.org/zap"
)

// RecurringJob defines a job that should be enqueued at a fixed interval.
type RecurringJob struct {
	Kind     string
	Payload  any
	Interval time.Duration
}

// Scheduler enqueues recurring jobs on a fixed interval tick loop.
type Scheduler struct {
	queue  Queue
	jobs   []RecurringJob
	logger *zap.Logger
	cancel context.CancelFunc
	wg     sync.WaitGroup
	mu     sync.Mutex
}

// NewScheduler creates a Scheduler.
func NewScheduler(q Queue, logger *zap.Logger) *Scheduler {
	return &Scheduler{queue: q, logger: logger}
}

// Add registers a recurring job. Must be called before Start.
func (s *Scheduler) Add(kind string, payload any, interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs = append(s.jobs, RecurringJob{Kind: kind, Payload: payload, Interval: interval})
}

// Start launches one goroutine per recurring job. Returns immediately.
func (s *Scheduler) Start(ctx context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ctx, s.cancel = context.WithCancel(ctx)
	for _, j := range s.jobs {
		j := j
		s.wg.Add(1)
		go s.tick(ctx, j)
	}
	s.logger.Info("job scheduler started", zap.Int("jobs", len(s.jobs)))
}

// Stop signals all scheduler goroutines to exit and waits.
func (s *Scheduler) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
	s.wg.Wait()
	s.logger.Info("job scheduler stopped")
}

func (s *Scheduler) tick(ctx context.Context, j RecurringJob) {
	defer s.wg.Done()
	t := time.NewTicker(j.Interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			raw, err := json.Marshal(j.Payload)
			if err != nil {
				s.logger.Error("scheduler marshal payload", zap.String("kind", j.Kind), zap.Error(err))
				continue
			}
			_, err = s.queue.Enqueue(ctx, EnqueueParams{
				Kind:    j.Kind,
				Payload: json.RawMessage(raw),
			})
			if err != nil {
				s.logger.Error("scheduler enqueue failed", zap.String("kind", j.Kind), zap.Error(err))
			} else {
				s.logger.Debug("scheduler enqueued job", zap.String("kind", j.Kind))
			}
		}
	}
}
