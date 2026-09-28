# Repository guidance

## Local project context

If `.private-context/index.md` exists, read it before planning, reviewing, or
modifying this project. The directory is intentionally untracked and contains
maintainer-only background. Follow its routing instructions and read only the
documents relevant to the current task.

## Public/private boundary

- `config.example.yaml` is the publishable configuration example.
- `config.yaml`, `.env`, `.data/`, and `.private-context/` are local-only.
- Never copy private endpoints, credentials, generated media, or maintainer
  notes from local-only files into tracked files.
- The Android shell takes its deployment address from the `RSS_POD_WEB_URL`
  repository variable and its signing key from repository secrets. Neither
  belongs in a tracked file; `android/` keeps `https://pod.example.com` as its
  only placeholder.
- Keep all examples safe to publish and disabled by default when they can call
  paid or external services.

## Validation

- Run `gofmt` on changed Go files.
- Run `go test ./...` for code or configuration changes.
- Run `go vet ./...` when changing Go behavior.
- Build the Docker image when changing the Dockerfile, embedded web assets,
  configuration example, or release workflow.
- Build the Android shell (`gradle -p android assembleRelease`, JDK 17 plus SDK
  platform 35 and build-tools 35.0.0) when changing `android/` or the web assets
  it loads, or let the reusable `.github/workflows/android-apk.yml` (the `android`
  job in the CI workflow) do it.

