package com.rsspod.app

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import java.net.URI
import java.net.URISyntaxException

/**
 * The address the shell opens. A build points the shell at a deployment, and
 * this keeps the page of that deployment a listener would rather come back to
 * -- the admin screen, say -- so a launch opens it directly instead of walking
 * to it from the root.
 *
 * The value belongs to the shell rather than to the page: it is what the next
 * window is pointed at, and a browser, which has no next window to point, is
 * not offered the field that writes it. The page reaches this through the
 * bridge, so what a launch reads and what the field shows are the same value.
 */
object ShellHome {

    private const val STORE = "rss-pod"
    private const val HOME_URL = "home-url"

    private var store: SharedPreferences? = null

    /**
     * Opened before the first load, so the address is there to be read while the
     * window is still being built.
     */
    fun attach(context: Context) {
        store = context.applicationContext.getSharedPreferences(STORE, Context.MODE_PRIVATE)
    }

    /** The chosen address, or the one this build was pointed at. */
    fun url(): String =
        store?.getString(HOME_URL, null)?.takeIf { it.isNotBlank() } ?: BuildConfig.BASE_URL

    /**
     * Takes the address the next launch opens, and says whether it was one the
     * shell could open.
     *
     * The settings panel is the only way back to this choice, and the address is
     * what serves that panel: an address this deployment does not answer on
     * would leave a listener with nothing to correct it in, so a value is only
     * taken when it names the deployment the build was made for. Which page of
     * that deployment is opened is the listener's to choose.
     */
    fun save(typed: String): Boolean {
        val preferences = store ?: return false
        val value = typed.trim()
        // Blank hands the shell back the address its build carries, which is
        // what a listener who has tried another page asks for.
        if (value.isEmpty()) {
            preferences.edit().remove(HOME_URL).apply()
            return true
        }
        val address = resolve(value) ?: return false
        preferences.edit().putString(HOME_URL, address).apply()
        return true
    }

    /**
     * The address a typed value names, or null when the shell could not open it.
     * A value without a scheme is read as a path on the deployment, so "/admin"
     * and the whole address it stands for are both taken.
     */
    private fun resolve(typed: String): String? {
        if (typed.any { it.isWhitespace() }) return null
        val resolved = try {
            // URI rather than Uri: resolving a path against the build address is
            // what turns "/admin" into an address of its own, and an address that
            // carries a scheme is left as it was typed.
            URI(BuildConfig.BASE_URL).resolve(typed)
        } catch (_: URISyntaxException) {
            return null
        }
        val base = Uri.parse(BuildConfig.BASE_URL)
        val candidate = Uri.parse(resolved.toString())
        if (candidate.userInfo != null) return null
        if (!sameOrigin(candidate, base)) return null
        // A fragment names a place inside a page rather than a page, and the
        // shell opens a page, so it is dropped from what is kept.
        return candidate.buildUpon().fragment(null).build().toString()
    }

    /** Whether two addresses are served by the same deployment. */
    private fun sameOrigin(candidate: Uri, base: Uri): Boolean {
        if (!candidate.scheme.orEmpty().equals(base.scheme.orEmpty(), ignoreCase = true)) return false
        if (!candidate.host.orEmpty().equals(base.host.orEmpty(), ignoreCase = true)) return false
        return port(candidate) == port(base)
    }

    /** A scheme's own port is the one a value naming no port is read as. */
    private fun port(uri: Uri): Int = when {
        uri.port != -1 -> uri.port
        uri.scheme.orEmpty().equals("https", ignoreCase = true) -> 443
        else -> 80
    }
}
