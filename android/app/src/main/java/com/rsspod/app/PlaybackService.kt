package com.rsspod.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.graphics.drawable.toBitmap
import org.json.JSONObject

/**
 * Holds the transport while an episode plays. The audio never leaves the WebView;
 * what this service adds is a session the notification shade, the lock screen and
 * the headset buttons can talk to, plus the foreground state that keeps the
 * process - and with it the page - from being frozen behind the screen.
 */
class PlaybackService : Service() {

    private lateinit var session: MediaSessionCompat

    private var foreground = false
    private var hasEpisode = false
    private var playing = false
    private var canPrevious = false
    private var canNext = false

    private val artwork: Bitmap? by lazy {
        try {
            AppCompatResources.getDrawable(this, R.mipmap.ic_launcher)?.toBitmap(192, 192)
        } catch (_: Exception) {
            null
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        createChannel()
        session = MediaSessionCompat(this, SESSION_TAG).apply {
            setCallback(
                object : MediaSessionCompat.Callback() {
                    override fun onPlay() = PlayerBridge.command("play")
                    override fun onPause() = PlayerBridge.command("pause")
                    override fun onStop() = PlayerBridge.command("pause")
                    override fun onSkipToNext() = PlayerBridge.command("next")
                    override fun onSkipToPrevious() = PlayerBridge.command("previous")
                    override fun onSeekTo(position: Long) =
                        PlayerBridge.command("seek", """{"position":${position / 1000.0}}""")
                },
            )
            // The media button and transport flags are implied since androidx.media
            // 1.1 and setFlags is deprecated; the session already handles both.
            setSessionActivity(contentIntent())
            isActive = true
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_TOGGLE -> PlayerBridge.command(if (playing) "pause" else "play")
            ACTION_NEXT -> PlayerBridge.command("next")
            ACTION_PREVIOUS -> PlayerBridge.command("previous")
            ACTION_DISMISS -> {
                // Swiping the card away means the listener is done with the card,
                // not with the episode: the page keeps playing, and the card comes
                // back with the next state the page sends.
                stopForeground(STOP_FOREGROUND_REMOVE)
                foreground = false
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        session.release()
        super.onDestroy()
    }

    // ---- state pushed by the page ----

    private fun applyState(json: String) {
        val payload = parse(json) ?: return
        val title = payload.optString("title")
        val artist = payload.optString("artist")
        // A page with no episode selected has nothing to keep a session for.
        if (title.isEmpty()) {
            applyStopped()
            return
        }

        playing = payload.optBoolean("playing")
        canPrevious = payload.optBoolean("canPrevious")
        canNext = payload.optBoolean("canNext")
        hasEpisode = true

        session.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, getString(R.string.app_name))
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, millis(payload.optDouble("duration")))
                .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork)
                .build(),
        )
        session.setPlaybackState(playbackState(millis(payload.optDouble("position")), rate(payload)))
        promote(title, artist)
    }

    /**
     * timeupdate arrives about four times a second; the session is told where the
     * page is, and the system extrapolates from there, so the card never needs a
     * redraw of its own.
     */
    private fun applyProgress(json: String) {
        if (!hasEpisode) return
        val payload = parse(json) ?: return
        session.setPlaybackState(playbackState(millis(payload.optDouble("position")), rate(payload)))
    }

    private fun applyStopped() {
        hasEpisode = false
        playing = false
        canPrevious = false
        canNext = false
        session.setMetadata(null)
        session.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setState(PlaybackStateCompat.STATE_NONE, 0L, 1f)
                .build(),
        )
        if (foreground) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            foreground = false
        }
    }

    // ---- notification ----

    private fun promote(title: String, text: String) {
        val notification = buildNotification(title, text)
        try {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                } else {
                    0
                },
            )
            foreground = true
        } catch (_: Exception) {
            // Android 12+ refuses a promotion the listener did not ask for; the
            // episode keeps playing, it just has no card in the shade.
            showCard(notification)
        }
    }

    private fun showCard(notification: Notification) {
        try {
            NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
        } catch (_: Exception) {
            // Notifications are off for this app.
        }
    }

    private fun buildNotification(title: String, text: String): Notification {
        val toggle = if (playing) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause,
                getString(R.string.action_pause),
                commandIntent(ACTION_TOGGLE),
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play,
                getString(R.string.action_play),
                commandIntent(ACTION_TOGGLE),
            )
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_rsspod)
            .setLargeIcon(artwork)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(contentIntent())
            .setDeleteIntent(commandIntent(ACTION_DISMISS))
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            // A playing episode cannot be swiped away; a paused one can, and the
            // delete intent above is what hears about it.
            .setOngoing(playing)
            .addAction(
                android.R.drawable.ic_media_previous,
                getString(R.string.action_previous),
                commandIntent(ACTION_PREVIOUS),
            )
            .addAction(toggle)
            .addAction(
                android.R.drawable.ic_media_next,
                getString(R.string.action_next),
                commandIntent(ACTION_NEXT),
            )
            .setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(session.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2),
            )
            .build()
    }

    private fun createChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                getString(R.string.channel_playback),
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = getString(R.string.channel_playback_description)
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            },
        )
    }

    private fun contentIntent(): PendingIntent = PendingIntent.getActivity(
        this,
        0,
        Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    private fun commandIntent(action: String): PendingIntent = PendingIntent.getService(
        this,
        action.hashCode(),
        Intent(this, PlaybackService::class.java).setAction(action),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    // ---- helpers ----

    private fun playbackState(position: Long, speed: Float): PlaybackStateCompat {
        val actions = PlaybackStateCompat.ACTION_PLAY or
            PlaybackStateCompat.ACTION_PAUSE or
            PlaybackStateCompat.ACTION_PLAY_PAUSE or
            PlaybackStateCompat.ACTION_SEEK_TO or
            (if (canPrevious) PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS else 0L) or
            (if (canNext) PlaybackStateCompat.ACTION_SKIP_TO_NEXT else 0L)
        return PlaybackStateCompat.Builder()
            .setActions(actions)
            .setState(
                if (playing) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
                position,
                speed,
            )
            .build()
    }

    private fun parse(json: String): JSONObject? = try {
        JSONObject(json)
    } catch (_: Exception) {
        null
    }

    private fun millis(seconds: Double): Long =
        if (seconds.isFinite() && seconds > 0) (seconds * 1000).toLong() else 0L

    private fun rate(payload: JSONObject): Float =
        payload.optDouble("rate", 1.0).toFloat().takeIf { it > 0f } ?: 1f

    companion object {
        private const val SESSION_TAG = "rss-pod"
        private const val CHANNEL_ID = "rss-pod-playback"
        private const val NOTIFICATION_ID = 1

        private const val ACTION_TOGGLE = "com.rsspod.app.PLAYBACK_TOGGLE"
        private const val ACTION_NEXT = "com.rsspod.app.PLAYBACK_NEXT"
        private const val ACTION_PREVIOUS = "com.rsspod.app.PLAYBACK_PREVIOUS"
        private const val ACTION_DISMISS = "com.rsspod.app.PLAYBACK_DISMISS"

        @Volatile
        private var instance: PlaybackService? = null

        /**
         * Idempotent: the activity calls this while it is in front, which is what
         * makes the start legal, and the promotion to a foreground service happens
         * later, from inside the running service.
         */
        fun ensureStarted(context: Context) {
            if (instance != null) return
            val app = context.applicationContext
            try {
                app.startService(Intent(app, PlaybackService::class.java))
            } catch (_: Exception) {
                // A start the system refuses costs the card, not the playback.
            }
        }

        fun onState(json: String) = instance?.applyState(json)

        fun onProgress(json: String) = instance?.applyProgress(json)

        fun onStopped() = instance?.applyStopped()
    }
}
