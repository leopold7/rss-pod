package edgetts

import (
	"crypto/sha256"
	"fmt"
	"math/rand/v2"
	"net/http"
	"sync"
	"time"
)

// clockSkew tracks the difference between local and server time.
var (
	clockSkew   time.Duration
	clockSkewMu sync.Mutex
)

// generateSecMSGEC generates the Sec-MS-GEC security token based on the current time.
func generateSecMSGEC() string {
	clockSkewMu.Lock()
	skew := clockSkew
	clockSkewMu.Unlock()

	now := time.Now().Add(skew)

	// Convert to Windows file time epoch (1601-01-01) in seconds.
	ticks := now.Unix() + 11644473600

	// Round down to nearest 5 minutes.
	ticks -= ticks % 300

	// Convert to 100-nanosecond intervals.
	ticks100ns := ticks * (1e9 / 100)

	// Hash with trusted client token.
	input := fmt.Sprintf("%d%s", ticks100ns, trustedClientToken)
	hash := sha256.Sum256([]byte(input))
	return fmt.Sprintf("%X", hash)
}

// generateMUID generates a random Machine User ID (32-character hex string).
func generateMUID() string {
	b := make([]byte, 16)
	for i := range b {
		b[i] = byte(rand.IntN(256))
	}
	return fmt.Sprintf("%X", b)
}

// adjustClockSkew adjusts the local clock skew based on a server response.
// It returns an error if the server date cannot be parsed.
func adjustClockSkew(resp *http.Response) error {
	dateStr := resp.Header.Get("Date")
	if dateStr == "" {
		return fmt.Errorf("%w: no Date header in response", ErrSkewAdjustment)
	}

	serverTime, err := http.ParseTime(dateStr)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrSkewAdjustment, err)
	}

	clockSkewMu.Lock()
	clockSkew = time.Until(serverTime)
	clockSkewMu.Unlock()

	return nil
}
