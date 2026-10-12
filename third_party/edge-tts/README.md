# edge-tts

A Go port of [edge-tts](https://github.com/rany2/edge-tts) — use Microsoft Edge's online text-to-speech service from the command line or as a Go library.

> **rss-pod patches this copy locally.** It is `v1.0.1` with the synthesis
> endpoint moved to Microsoft's v2 Read Aloud service
> (`api.msedgeservices.com/tts/cognitiveservices`), because the legacy v1
> WebSocket endpoint is increasingly rejected with HTTP 403. Only
> `constants.go`, `communicate.go` and `voices.go` differ from upstream, and
> every change is marked with a `Patched (rss-pod)` comment. The voice list is
> requested from v2 first and falls back to the legacy v1 endpoint, which still
> returns the catalog, so it switches over on its own once v2 serves it. Run
> `go test ./...` inside this directory to check the patch. The installation
> commands below refer to the upstream module, not to this copy. Licensed under
> LGPL-3.0; see [LICENSE](LICENSE).

## Features

- Text-to-speech synthesis via Microsoft Edge's TTS service
- 400+ voices across 90+ languages
- Adjustable speech rate, volume, and pitch
- SRT subtitle generation with word or sentence boundaries
- Streaming API for real-time audio processing
- HTTP proxy support

## Installation

### CLI

```sh
go install github.com/foresturquhart/edge-tts/cmd/edge-tts@latest
```

### Library

```sh
go get github.com/foresturquhart/edge-tts
```

Requires Go 1.26 or later.

## CLI Usage

### List available voices

```sh
edge-tts --list-voices
```

### Synthesize speech

```sh
# Text to file
edge-tts -t "Hello, world!" --write-media output.mp3

# With a specific voice
edge-tts -t "Bonjour le monde" -v fr-FR-DeniseNeural --write-media output.mp3

# With subtitles
edge-tts -t "Hello, world!" --write-media output.mp3 --write-subtitles output.srt

# From a file
edge-tts -f input.txt --write-media output.mp3

# From stdin
echo "Hello, world!" | edge-tts --write-media output.mp3

# Adjust rate, volume, pitch
edge-tts -t "Slow and low" --rate -30% --volume +50% --pitch -20Hz --write-media output.mp3

# Word-level subtitles
edge-tts -t "Hello, world!" --write-media output.mp3 --write-subtitles output.srt --boundary word

# Via proxy
edge-tts -t "Hello" --proxy http://localhost:8080 --write-media output.mp3
```

### CLI flags

| Flag | Description |
|------|-------------|
| `-t`, `--text` | Text to speak |
| `-f`, `--file` | Read text from file (`-` for stdin) |
| `-l`, `--list-voices` | List available voices |
| `-v`, `--voice` | Voice name (default: `en-US-EmmaMultilingualNeural`) |
| `--rate` | Speech rate, e.g. `+50%`, `-30%` (default: `+0%`) |
| `--volume` | Volume, e.g. `+50%`, `-30%` (default: `+0%`) |
| `--pitch` | Pitch, e.g. `+50Hz`, `-20Hz` (default: `+0Hz`) |
| `--write-media` | Write audio to file (`-` for stdout) |
| `--write-subtitles` | Write SRT subtitles to file (`-` for stderr) |
| `--proxy` | HTTP proxy URL |
| `--boundary` | `word` or `sentence` (default: `sentence`) |

## Library Usage

### Basic synthesis

```go
package main

import (
    "context"
    "log"

    edgetts "github.com/foresturquhart/edge-tts"
)

func main() {
    config := edgetts.DefaultConfig()
    config.Voice = "en-GB-SoniaNeural"

    comm, err := edgetts.NewCommunicate("Hello from Go!", config)
    if err != nil {
        log.Fatal(err)
    }

    err = comm.Save(context.Background(), "output.mp3", "output.srt")
    if err != nil {
        log.Fatal(err)
    }
}
```

### Streaming

```go
err = comm.Stream(ctx, func(chunk edgetts.TTSChunk) error {
    switch chunk.Type {
    case edgetts.ChunkTypeAudio:
        // chunk.Data contains MP3 audio bytes
        player.Write(chunk.Data)
    case edgetts.ChunkTypeWordBoundary:
        // chunk.Text, chunk.Offset, chunk.Duration
        fmt.Printf("[%v] %s\n", chunk.Offset, chunk.Text)
    }
    return nil
})
```

### Listing and filtering voices

```go
vm, err := edgetts.NewVoicesManager(ctx, "")
if err != nil {
    log.Fatal(err)
}

// Find all French female voices
voices := vm.Find(map[string]string{
    "Language": "fr",
    "Gender":   "Female",
})

for _, v := range voices {
    fmt.Println(v.ShortName)
}
```

## Audio format

Output is MP3: 24 kHz, 48 kbps, mono.

## Acknowledgements

This is a Go port of [edge-tts](https://github.com/rany2/edge-tts) by rany2.

## License

This project is licensed under the [GNU Lesser General Public License v3.0](LICENSE), the same license as the original edge-tts project.
