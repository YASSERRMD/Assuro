FROM golang:1.24-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git make
ENV GOTOOLCHAIN=auto

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /assuro ./cmd/assuro
RUN GOBIN=/usr/local/bin CGO_ENABLED=0 GOOS=linux go install github.com/pressly/goose/v3/cmd/goose@v3.24.1

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /assuro /usr/local/bin/assuro
COPY --from=builder /usr/local/bin/goose /usr/local/bin/goose
COPY migrations/ /migrations/

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
