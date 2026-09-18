package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestPlayerWebHandlerRedirectsRootByPreferredLanguage(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		acceptLanguage string
		wantLocation   string
	}{
		{name: "Chinese", acceptLanguage: "zh-CN,zh;q=0.9,en;q=0.8", wantLocation: "/zh-cn?demo=1"},
		{name: "Traditional Chinese", acceptLanguage: "zh-Hant,en;q=0.8", wantLocation: "/zh-cn?demo=1"},
		{name: "English", acceptLanguage: "en-US,en;q=0.9,zh;q=0.8", wantLocation: "/en?demo=1"},
		{name: "quality", acceptLanguage: "zh-CN;q=0.4,en-US;q=0.9", wantLocation: "/en?demo=1"},
		{name: "fallback", acceptLanguage: "fr-FR", wantLocation: "/en?demo=1"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			request := httptest.NewRequest(http.MethodGet, "/?demo=1", nil)
			request.Header.Set("Accept-Language", test.acceptLanguage)
			response := httptest.NewRecorder()
			playerWebHandler().ServeHTTP(response, request)

			if response.Code != http.StatusFound {
				t.Fatalf("status = %d, want 302", response.Code)
			}
			if location := response.Header().Get("Location"); location != test.wantLocation {
				t.Fatalf("Location = %q, want %q", location, test.wantLocation)
			}
			if cacheControl := response.Header().Get("Cache-Control"); cacheControl != "no-store" {
				t.Fatalf("Cache-Control = %q, want no-store", cacheControl)
			}
			if vary := response.Header().Get("Vary"); vary != "Accept-Language" {
				t.Fatalf("Vary = %q, want Accept-Language", vary)
			}
		})
	}
}

func TestPlayerWebHandlerServesEnglishRoute(t *testing.T) {
	t.Parallel()

	for _, path := range []string{"/en", "/en/"} {
		request := httptest.NewRequest(http.MethodGet, path, nil)
		response := httptest.NewRecorder()
		playerWebHandler().ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200", path, response.Code)
		}
		if !strings.Contains(response.Body.String(), "Commute Podcasts") {
			t.Fatalf("%s: embedded index does not contain the player title", path)
		}
		if !strings.Contains(response.Body.String(), `href="https://github.com/synrise25/rss-pod"`) {
			t.Fatalf("%s: embedded index does not contain the GitHub repository link", path)
		}
		if language := response.Header().Get("Content-Language"); language != "en" {
			t.Fatalf("%s: Content-Language = %q, want en", path, language)
		}
	}
}

func TestPlayerWebHandlerServesChineseRoute(t *testing.T) {
	t.Parallel()

	for _, path := range []string{"/zh-cn", "/zh-cn/"} {
		request := httptest.NewRequest(http.MethodGet, path, nil)
		response := httptest.NewRecorder()
		playerWebHandler().ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200", path, response.Code)
		}
		if !strings.Contains(response.Body.String(), `src="/app.js"`) {
			t.Fatalf("%s: Chinese route does not serve the player application", path)
		}
		if values, exists := response.Header()["Content-Language"]; exists {
			t.Fatalf("%s: Content-Language = %q, want header omitted for the English HTML shell", path, values)
		}
	}
}

func TestPlayerWebHandlerServesThemeToggleInsideHeaderActions(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/en", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	body := response.Body.String()
	language := strings.Index(body, `id="language-switcher"`)
	theme := strings.Index(body, `id="theme-toggle"`)
	github := strings.Index(body, `id="github-link"`)
	if language < 0 || theme < 0 || github < 0 {
		t.Fatalf("player shell is missing a header control: language=%d theme=%d github=%d", language, theme, github)
	}
	if language > theme || theme > github {
		t.Fatalf("theme toggle is not between the language switcher and the GitHub link: language=%d theme=%d github=%d", language, theme, github)
	}
	for _, icon := range []string{"theme-icon-system", "theme-icon-light", "theme-icon-dark"} {
		if !strings.Contains(body, icon) {
			t.Fatalf("theme toggle is missing the %s icon", icon)
		}
	}
}

func TestPlayerWebHandlerServesSettingsPanelLeftOfLanguageSwitcher(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/en", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	body := response.Body.String()
	settings := strings.Index(body, `id="settings-toggle"`)
	panel := strings.Index(body, `id="settings-panel"`)
	language := strings.Index(body, `id="language-switcher"`)
	if settings < 0 || panel < 0 || language < 0 {
		t.Fatalf("player shell is missing a settings control: toggle=%d panel=%d language=%d", settings, panel, language)
	}
	if settings > language {
		t.Fatalf("settings button is not left of the language switcher: settings=%d language=%d", settings, language)
	}
	if panel < settings {
		t.Fatalf("settings panel is not nested inside the settings menu: panel=%d settings=%d", panel, settings)
	}
	// The panel offers the theme preference and the list layout, which the
	// player renders from these values.
	for _, control := range []string{
		`data-theme-mode="system"`,
		`data-theme-mode="light"`,
		`data-theme-mode="dark"`,
		`data-display-mode="date"`,
		`data-display-mode="category"`,
	} {
		if !strings.Contains(body, control) {
			t.Fatalf("settings panel is missing %s", control)
		}
	}
}

func TestPlayerWebHandlerServesPlayerDrawerToggleInsidePlayerDock(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/en", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	body := response.Body.String()
	dock := strings.Index(body, `id="player-dock"`)
	toggle := strings.Index(body, `id="player-drawer-toggle"`)
	// The toast follows the dock, so it marks the end of the section.
	toast := strings.Index(body, `id="toast"`)
	if dock < 0 || toggle < 0 || toast < 0 {
		t.Fatalf("player shell is missing the drawer control: dock=%d toggle=%d toast=%d", dock, toggle, toast)
	}
	if toggle < dock || toggle > toast {
		t.Fatalf("drawer toggle is not inside the player dock: dock=%d toggle=%d toast=%d", dock, toggle, toast)
	}
	if !strings.Contains(body, `aria-controls="player-dock"`) {
		t.Fatal("player drawer toggle does not name the dock it folds away")
	}
}

func TestPlayerWebHandlerServesStageIcons(t *testing.T) {
	t.Parallel()

	// One icon per download stage, plus the retry control a failed download
	// shows; the player swaps them in as the episode state changes.
	for _, icon := range []string{"reading.svg", "writing.svg", "voice.svg", "upload.svg", "retry.svg"} {
		request := httptest.NewRequest(http.MethodGet, "/icons/"+icon, nil)
		response := httptest.NewRecorder()
		playerWebHandler().ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200", icon, response.Code)
		}
		if contentType := response.Header().Get("Content-Type"); contentType != "image/svg+xml" {
			t.Fatalf("%s: Content-Type = %q, want image/svg+xml", icon, contentType)
		}
		if response.Body.Len() == 0 {
			t.Fatalf("embedded %s is empty", icon)
		}
	}
}

func TestPlayerWebHandlerDoesNotCaptureUnknownAPIPaths(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/api/v1/unknown", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", response.Code)
	}
}

func TestPlayerWebHandlerServesAppIcon(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/icons/favicon.png", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "image/png" {
		t.Fatalf("Content-Type = %q, want image/png", contentType)
	}
	if response.Body.Len() == 0 {
		t.Fatal("embedded favicon is empty")
	}
}

func TestPlayerWebHandlerServesGitHubIcon(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/icons/github.svg", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "image/svg+xml" {
		t.Fatalf("Content-Type = %q, want image/svg+xml", contentType)
	}
	if response.Body.Len() == 0 {
		t.Fatal("embedded GitHub icon is empty")
	}
}

func TestPlayerWebHandlerServesVendoredSwiper(t *testing.T) {
	t.Parallel()

	// The list pages sideways with Swiper, which ships inside the binary: the
	// player must not need a CDN for it.
	for _, asset := range []string{
		"/vendor/swiper/swiper-bundle.min.js",
		"/vendor/swiper/swiper-bundle.min.css",
	} {
		request := httptest.NewRequest(http.MethodGet, asset, nil)
		response := httptest.NewRecorder()
		playerWebHandler().ServeHTTP(response, request)

		if response.Code != http.StatusOK {
			t.Fatalf("%s: status = %d, want 200", asset, response.Code)
		}
		if response.Body.Len() == 0 {
			t.Fatalf("embedded %s is empty", asset)
		}
	}

	request := httptest.NewRequest(http.MethodGet, "/en", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	body := response.Body.String()
	if !strings.Contains(body, `id="episode-slider"`) || !strings.Contains(body, `class="swiper-wrapper"`) {
		t.Fatal("player shell does not contain the paging episode list")
	}
	swiper := strings.Index(body, "/vendor/swiper/swiper-bundle.min.css")
	player := strings.Index(body, `href="/app.css"`)
	if swiper < 0 || player < 0 {
		t.Fatalf("player shell is missing a stylesheet: swiper=%d player=%d", swiper, player)
	}
	if swiper > player {
		t.Fatalf("vendored stylesheet is not loaded before the player stylesheet: swiper=%d player=%d", swiper, player)
	}
}

func TestPlayerWebHandlerServesDownloadIcon(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/icons/download.svg", nil)
	response := httptest.NewRecorder()
	playerWebHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", response.Code)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "image/svg+xml" {
		t.Fatalf("Content-Type = %q, want image/svg+xml", contentType)
	}
	if response.Body.Len() == 0 {
		t.Fatal("embedded download icon is empty")
	}
}
