package alerts

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/YASSERRMD/Assuro/internal/events"
	"github.com/YASSERRMD/Assuro/internal/notify"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// Evaluator subscribes to the event bus and fires alert rules when conditions match.
type Evaluator struct {
	pool    *pgxpool.Pool
	notify  *notify.Service
	logger  *zap.Logger
}

// NewEvaluator creates an Evaluator.
func NewEvaluator(pool *pgxpool.Pool, ns *notify.Service, logger *zap.Logger) *Evaluator {
	return &Evaluator{pool: pool, notify: ns, logger: logger}
}

// Register subscribes the evaluator to the bus for all events.
func (e *Evaluator) Register(bus *events.Bus) {
	bus.Subscribe("*", e.evaluate)
}

// RegisterKind subscribes the evaluator for a specific event kind.
func (e *Evaluator) RegisterKind(bus *events.Bus, kind string) {
	bus.Subscribe(kind, e.evaluate)
}

func (e *Evaluator) evaluate(ctx context.Context, ev events.Event) {
	rows, err := e.pool.Query(ctx,
		`SELECT id, name, condition, channels FROM alert_rules
		 WHERE org_id = $1 AND enabled = true AND trigger_kind = $2`,
		ev.OrgID, ev.Kind,
	)
	if err != nil {
		e.logger.Error("alert rule query failed", zap.Error(err))
		return
	}
	defer rows.Close()

	type rule struct {
		id        string
		name      string
		condition json.RawMessage
		channels  []string
	}

	for rows.Next() {
		var r rule
		if err := rows.Scan(&r.id, &r.name, &r.condition, &r.channels); err != nil {
			continue
		}
		if e.matches(ev, r.condition) {
			e.fire(ctx, ev, r.name, r.channels)
		}
	}
}

// matches evaluates whether the event satisfies the rule condition.
// Conditions are simple key-value maps; an empty condition always matches.
func (e *Evaluator) matches(ev events.Event, condition json.RawMessage) bool {
	if len(condition) == 0 || string(condition) == "{}" {
		return true
	}
	var cond map[string]any
	if err := json.Unmarshal(condition, &cond); err != nil {
		return false
	}
	payload, ok := ev.Payload.(map[string]any)
	if !ok {
		raw, _ := json.Marshal(ev.Payload)
		_ = json.Unmarshal(raw, &payload)
	}
	for k, v := range cond {
		if fmt.Sprint(payload[k]) != fmt.Sprint(v) {
			return false
		}
	}
	return true
}

func (e *Evaluator) fire(ctx context.Context, ev events.Event, ruleName string, channels []string) {
	// Gather org users to notify via in-app channel
	rows, err := e.pool.Query(ctx,
		`SELECT id FROM users WHERE org_id = $1`, ev.OrgID)
	if err != nil {
		return
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var id string
		if _ = rows.Scan(&id); id != "" {
			userIDs = append(userIDs, id)
		}
	}

	if len(userIDs) == 0 {
		return
	}

	_ = e.notify.Notify(ctx, notify.NotifyInput{
		OrgID:    ev.OrgID,
		UserIDs:  userIDs,
		Category: "alert",
		Title:    fmt.Sprintf("Alert: %s", ruleName),
		Body:     fmt.Sprintf("Rule '%s' triggered by event '%s'.", ruleName, ev.Kind),
		Severity: "warning",
	})
}
