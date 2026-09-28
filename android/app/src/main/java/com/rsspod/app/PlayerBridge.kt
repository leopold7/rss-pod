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
