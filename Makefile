.PHONY: build run test lint fmt docker-up docker-down migrate-up migrate-down demo-seed

BINARY=assuro
CMD=./cmd/assuro
PKG=./...

build:
	go build -o $(BINARY) $(CMD)

run: build
	./$(BINARY)

test:
	go test -race -count=1 $(PKG)

lint:
	golangci-lint run ./...

fmt:
	gofmt -s -w .

docker-up:
	docker compose up -d

docker-down:
	docker compose down

migrate-up:
	goose -dir migrations up

migrate-down:
	goose -dir migrations down

demo-seed: build
	./$(BINARY) -seed-demo
