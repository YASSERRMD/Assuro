FROM golang:1.23-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git make

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /assuro ./cmd/assuro

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /assuro /usr/local/bin/assuro
COPY migrations/ /migrations/

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
