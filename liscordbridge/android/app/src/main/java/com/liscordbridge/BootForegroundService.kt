package com.liscordbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * BootForegroundService — a PERSISTENT foreground service.
 *
 * - Keeps process alive so SmsBroadcastReceiver stays active
 * - Periodically checks GitHub Releases for app updates
 * - Shows notification when new version available
 */
class BootForegroundService : Service() {

    companion object {
        private const val TAG = "LiscordBootSvc"
        private const val CHANNEL_ID = "liscord_sms_monitor"
        private const val UPDATE_CHANNEL_ID = "liscord_update"
        private const val NOTIFICATION_ID = 9001
        private const val UPDATE_NOTIFICATION_ID = 9002
        private const val GITHUB_RELEASE_URL = "https://api.github.com/repos/oidovnamnan/liscord.com/releases/tags/bridge-latest"
        private const val APK_DOWNLOAD_URL = "https://github.com/oidovnamnan/liscord.com/releases/download/bridge-latest/app-release.apk"
        private const val UPDATE_CHECK_INTERVAL = 30 * 60 * 1000L // 30 minutes
    }

    private val handler = Handler(Looper.getMainLooper())
    private var updateCheckRunnable: Runnable? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        createUpdateChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "✅ Persistent SMS monitor service started")

        // Tap notification → open app
        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(
                this, 0, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Liscord Bridge")
            .setContentText("SMS орлого хяналт идэвхтэй ✅")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        // Start periodic update checks
        startUpdateChecks()

        // START_STICKY = restart service if killed by OS
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        updateCheckRunnable?.let { handler.removeCallbacks(it) }
        Log.w(TAG, "⚠️ Service destroyed — SMS monitoring may stop")
    }

    private fun startUpdateChecks() {
        updateCheckRunnable?.let { handler.removeCallbacks(it) }
        
        val runnable = object : Runnable {
            override fun run() {
                thread { checkForUpdate() }
                handler.postDelayed(this, UPDATE_CHECK_INTERVAL)
            }
        }
        updateCheckRunnable = runnable
        // First check after 60 seconds (let app settle)
        handler.postDelayed(runnable, 60000)
    }

    private fun checkForUpdate() {
        try {
            val url = URL(GITHUB_RELEASE_URL)
            val connection = url.openConnection() as HttpURLConnection
            connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
            connection.connectTimeout = 10000
            connection.readTimeout = 10000

            if (connection.responseCode != 200) {
                connection.disconnect()
                return
            }

            val responseText = connection.inputStream.bufferedReader().readText()
            connection.disconnect()

            val json = JSONObject(responseText)
            val body = json.optString("body", "")
            
            // Extract version from release body
            val versionRegex = Regex("v(\\d+\\.\\d+)")
            val match = versionRegex.find(body)
            val remoteVersion = match?.groupValues?.get(1) ?: return

            // Read current version from SharedPreferences (set by App.tsx)
            val prefs = getSharedPreferences("LiscordBridge", MODE_PRIVATE)
            val currentVersion = prefs.getString("appVersion", "1.6") ?: "1.6"
            val dismissedVersion = prefs.getString("dismissedUpdate", "") ?: ""

            if (remoteVersion != currentVersion && remoteVersion != dismissedVersion) {
                Log.i(TAG, "🚀 New version available: v$remoteVersion (current: v$currentVersion)")
                showUpdateNotification(remoteVersion)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Update check failed: ${e.message}")
        }
    }

    private fun showUpdateNotification(version: String) {
        // Open app when notification tapped
        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        tapIntent?.putExtra("updateAvailable", version)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(
                this, 1, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val notification = NotificationCompat.Builder(this, UPDATE_CHANNEL_ID)
            .setContentTitle("🚀 Шинэ хувилбар v$version")
            .setContentText("Liscord Bridge шинэчлэл бэлэн боллоо. Дарж шинэчлэнэ үү.")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(UPDATE_NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Хяналт",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "SMS орлого хяналтын мэдэгдэл"
                setShowBadge(false)
                setSound(null, null)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createUpdateChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                UPDATE_CHANNEL_ID,
                "Шинэчлэл",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Апп шинэчлэлийн мэдэгдэл"
                setShowBadge(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
