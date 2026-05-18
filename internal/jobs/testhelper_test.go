package jobs

import "go.uber.org/zap"

func newNopLogger() *zap.Logger {
	return zap.NewNop()
}
