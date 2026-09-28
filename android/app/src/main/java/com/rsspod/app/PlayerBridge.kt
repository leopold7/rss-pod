package com.rsspod.app

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import java.lang.ref.WeakReference

/**
 * The only object the page can reach. WebView reads the JavaScript interface off
 * the concrete class, so every exposed method is annotated here rather than on a
 * shared interface.
 *
 * Calls from the page arrive on the JavaBridge thread and are moved to the main
 * thread; calls into the page go through evaluateJavascript, which has to run
 * there anyway.
 */
object PlayerBridge {

    private val main = Handler(Looper.getMainLooper())
    private var view: WeakReference<WebView>? = null

    /**
     * The bar the system draws over the page, in the pixels the page lays out
     * in rather than the device's own.
     */
    private var statusBarInset = 0

    /**
     * Where the page's theme has to land. The bar the page is drawn under
     * belongs to the window, and the window belongs to the activity, so it
     * registers the call here rather than the page going past the bridge for
     * it. A browser has no bridge and never reaches this.
     */
    var onPageTheme: ((Boolean) -> Unit)? = null

    fun attach(webView: WebView) {
        view = WeakReference(webView)
    }

    fun detach(webView: WebView) {
        if (view?.get() === webView) view = null
    }

    /**
     * Native transport to the page. The names are the ones the page already uses
     * for its own media session actions, so both routes reach the same function.
     */
    fun command(name: String, payload: String? = null) {
        val call = if (payload == null) "command('$name')" else "command('$name', $payload)"
        val script = "window.RssPodPlayer && window.RssPodPlayer.$call"
        onMain {
            val webView = view?.get() ?: return@onMain
            webView.evaluateJavascript(script, null)
        }
    }

    private fun onMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) block() else main.post(block)
    }

    /**
     * Read by the page before its first paint: the header cannot ask the window
     * over it how much of the top the system bar takes, so the activity measures
     * it and it is kept here for the page to read on every load.
     */
    @JavascriptInterface
    fun insetTop(): Int = statusBarInset

    /**
     * The same measurement, arriving from the window, in the page's pixels. The
     * page is told as well: it is drawn already when the window moves, so
     * waiting for its next load would leave the header under the bar until then.
     */
    fun setInsetTop(pixels: Int) {
        if (pixels == statusBarInset) return
        statusBarInset = pixels
        onMain {
            val webView = view?.get() ?: return@onMain
            // A plain expression: the window can move more than once in a page's
            // life, and a declaration would be re-declared the second time.
            val script = "document.documentElement && " +
                "document.documentElement.style.setProperty('--shell-inset-top', '${pixels}px')"
            webView.evaluateJavascript(script, null)
        }
    }

    /**
     * The theme the page settled on, so the bar over it follows the page rather
     * than the device. Called from the page's pre-paint script and again on
     * every theme it changes to, since that never reloads the page.
     */
    @JavascriptInterface
    fun theme(mode: String) {
        val dark = mode == "dark"
        onMain { onPageTheme?.invoke(dark) }
    }

    @JavascriptInterface
    fun state(json: String) {
        onMain {
            val webView = view?.get() ?: return@onMain
            PlaybackService.ensureStarted(webView.context)
            PlaybackService.onState(json)
        }
    }

    @JavascriptInterface
    fun progress(json: String) {
        onMain { PlaybackService.onProgress(json) }
    }

    @JavascriptInterface
    fun stopped() {
        onMain { PlaybackService.onStopped() }
    }
}
