package jobs

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
)

// WorkerConfig controls worker behaviour.
type WorkerConfig struct {
	// WorkerID uniquely identifies this worker instance (used as lock owner).
	WorkerID string
	// Concurrency is the number of goroutines polling for jobs.
	Concurrency int
	// PollInterval is how long a goroutine sleeps when the queue is empty.
	PollInterval time.Duration
	// Kinds restricts which job kinds this worker will process. Nil = all.
	Kinds []string
}

func (c *WorkerConfig) setDefaults() {
	if c.WorkerID == "" {
		c.WorkerID = fmt.Sprintf("worker-%d", time.Now().UnixNano())
	}
	if c.Concurrency <= 0 {
		c.Concurrency = 5
	}
	if c.PollInterval <= 0 {
		c.PollInterval = 2 * time.Second
	}
}

// Worker polls the job queue and dispatches jobs to registered handlers.
type Worker struct {
	queue    Queue
	registry *Registry
	cfg      WorkerConfig
	logger   *zap.Logger
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

// NewWorker creates a Worker.
func NewWorker(q Queue, r *Registry, cfg WorkerConfig, logger *zap.Logger) *Worker {
	cfg.setDefaults()
	return &Worker{queue: q, registry: r, cfg: cfg, logger: logger}
}

// Start launches the worker goroutine pool. It returns immediately; use Stop to wait.
func (w *Worker) Start(ctx context.Context) {
	ctx, w.cancel = context.WithCancel(ctx)
	for i := 0; i < w.cfg.Concurrency; i++ {
		w.wg.Add(1)
		go w.loop(ctx, i)
	}
	w.logger.Info("job worker started",
		zap.String("id", w.cfg.WorkerID),
		zap.Int("concurrency", w.cfg.Concurrency),
	)
}

// Stop signals all goroutines to stop and waits for them to finish.
func (w *Worker) Stop() {
	if w.cancel != nil {
		w.cancel()
	}
	w.wg.Wait()
	w.logger.Info("job worker stopped", zap.String("id", w.cfg.WorkerID))
}

func (w *Worker) loop(ctx context.Context, n int) {
	defer w.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		job, err := w.queue.Dequeue(ctx, w.cfg.WorkerID, w.cfg.Kinds)
		if err != nil {
			w.logger.Error("dequeue error", zap.Error(err), zap.Int("goroutine", n))
			select {
			case <-ctx.Done():
				return
			case <-time.After(w.cfg.PollInterval):
			}
			continue
		}

		if job == nil {
			// Queue empty — back off before polling again.
			select {
			case <-ctx.Done():
				return
			case <-time.After(w.cfg.PollInterval):
			}
			continue
		}

		w.dispatch(ctx, job)
	}
}

func (w *Worker) dispatch(ctx context.Context, job *Job) {
	h, ok := w.registry.Get(job.Kind)
	if !ok {
		w.logger.Warn("no handler for job kind",
			zap.String("kind", job.Kind),
			zap.String("job_id", job.ID),
		)
		_ = w.queue.Fail(ctx, job.ID, fmt.Sprintf("no handler registered for kind %q", job.Kind))
		return
	}

	err := h(ctx, job.Payload)
	if err != nil {
		w.logger.Error("job handler failed",
			zap.String("kind", job.Kind),
			zap.String("job_id", job.ID),
			zap.Int("attempt", job.Attempts),
			zap.Error(err),
		)
		_ = w.queue.Fail(ctx, job.ID, err.Error())
		return
	}

	if err := w.queue.Ack(ctx, job.ID); err != nil {
		w.logger.Error("job ack failed",
			zap.String("job_id", job.ID),
			zap.Error(err),
		)
	} else {
		w.logger.Debug("job succeeded",
			zap.String("kind", job.Kind),
			zap.String("job_id", job.ID),
		)
	}
}
