package com.rsspod.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlin.math.roundToInt

/**
 * The player runs as the page a deployment already serves: its markup, its API
 * and its audio all come from one origin, so the shell only has to keep a
 * WebView alive and hand the transport over to the system.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val appHost: String by lazy { Uri.parse(BuildConfig.BASE_URL).host.orEmpty() }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // The screen stays on while the app is in front; listening behind the
        // screen is PlaybackService's job. The other flag lets the bar take a
        // colour of its own on the platforms that still paint one.
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS,
        )

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                // An episode that ends while the screen is off has to start the
                // next one without a tap.
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                // app.js opens the article behind an episode with window.open;
                // the throwaway window below is what turns that into a handoff
                // to the system browser.
                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = true
            }
            // /en, /zh-cn and the admin session all ride on cookies.
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, false)
            webViewClient = PlayerWebViewClient()
            webChromeClient = ExternalLinkClient()
            // Injected before the first load, so the page sees the bridge from
            // its first module statement on.
            addJavascriptInterface(PlayerBridge, "RssPodNative")
        }

        // The page cannot measure the bar floating over it, so the height the
        // window gives this view is passed on: the header adds it to its own
        // padding. The page reads the value again before each of its loads, so
        // a navigation does not wait for the window to move.
        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            // The page lays out in the density-independent pixels below, and the
            // inset arrives in device pixels.
            val density = resources.displayMetrics.density
            val barHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top / density
            PlayerBridge.setInsetTop(barHeight.roundToInt())
            insets
        }

        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)

        setContentView(webView)

        // The page is drawn behind the system bars on Android 15 and below them
        // wherever the platform still insets the window, so the bars open on the
        // theme the device is in and the page corrects them from its first
        // script on. Both the colours and the icons come from the page: a light
        // page on a dark device would otherwise sit under dark bars carrying
        // light icons, which is where a bar becomes something to look at.
        applyPageTheme(isNightMode())
        PlayerBridge.onPageTheme = this::applyPageTheme

        if (savedInstanceState == null) {
            webView.loadUrl(BuildConfig.BASE_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) webView.goBack() else finish()
                }
            },
        )

        // Starting the service now, while the app is certainly in front, is what
        // makes the later promotion to the foreground legal.
        PlaybackService.ensureStarted(this)
        requestNotificationPermission()
    }

    /** Same origin stays in the shell; anything else is the browser's business. */
    private inner class PlayerWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            val scheme = url.scheme.orEmpty()
            if ((scheme == "http" || scheme == "https") &&
                url.host.orEmpty().equals(appHost, ignoreCase = true)
            ) {
                return false
            }
            openExternally(url)
            return true
        }
    }

    /**
     * A window opened by the page never renders: it exists only to catch the
     * address and hand it to the browser, which keeps the player on its page.
     */
    private inner class ExternalLinkClient : WebChromeClient() {
        override fun onCreateWindow(
            view: WebView,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message,
        ): Boolean {
            val transport = resultMsg.obj as WebView.WebViewTransport
            val probe = WebView(view.context).apply {
                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        probeView: WebView,
                        request: WebResourceRequest,
                    ): Boolean {
                        openExternally(request.url)
                        probeView.post { probeView.destroy() }
                        return true
                    }
                }
            }
            transport.webView = probe
            resultMsg.sendToTarget()
            return true
        }
    }

    private fun openExternally(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: Exception) {
            // No app answers this link. Leaving it alone beats loading it into
            // the shell, where the player would lose its page.
        }
    }

    private fun isNightMode(): Boolean =
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES

    /**
     * The page draws the edges it meets, so both bars carry the colour the page
     * opens with instead of one of their own, and both sets of icons follow the
     * page rather than the device it is running on.
     *
     * Android 15 lets the page show through the bars and ignores the colours;
     * the platforms below it still paint them, and a bar that disagrees with the
     * page under it is worse than no bar at all. The bottom carries one layer
     * more: the scrim the system lays behind three-button navigation, whose
     * colour follows the system's theme rather than the page's. It is turned off
     * so the page is what reaches the bottom edge, which is also what the icons
     * below are read against.
     */
    private fun applyPageTheme(dark: Boolean) {
        val pageColor = ContextCompat.getColor(this, if (dark) R.color.page_dark else R.color.page_light)
        @Suppress("DEPRECATION")
        window.statusBarColor = pageColor
        @Suppress("DEPRECATION")
        window.navigationBarColor = pageColor
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = !dark
        controller.isAppearanceLightNavigationBars = !dark
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        if (!granted) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_REQUEST)
        }
    }

    override fun onResume() {
        super.onResume()
        PlayerBridge.attach(webView)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    // onPause is deliberately not forwarded to the WebView: pausing it freezes
    // the page, and the audio the page is playing would stop with it.
    override fun onDestroy() {
        // The window goes with this activity, so the page has nothing left to
        // reach it through.
        PlayerBridge.onPageTheme = null
        PlayerBridge.detach(webView)
        webView.destroy()
        super.onDestroy()
    }

    private companion object {
        const val NOTIFICATION_REQUEST = 1
    }
}
