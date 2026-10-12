# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM golang:1.26.2-alpine AS build

ARG TARGETOS
ARG TARGETARCH

WORKDIR /src
COPY go.mod go.sum ./
# The local replace target of go.mod must exist before the module graph is
# resolved, so copy it ahead of `go mod download` to keep that layer cached.
COPY third_party ./third_party
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w" -o /out/rss-pod ./cmd/rss-pod

FROM alpine:3.23

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S rsspod \
    && adduser -S -G rsspod rsspod

WORKDIR /app
COPY --from=build /out/rss-pod /usr/local/bin/rss-pod
COPY config.example.yaml /app/config.yaml
COPY prompts /app/prompts

USER rsspod
EXPOSE 8080
ENTRYPOINT ["rss-pod"]
CMD ["run", "--config", "/app/config.yaml"]
