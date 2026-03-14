package com.liscordbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar
import kotlin.concurrent.thread

/**
 * BootForegroundService — persistent foreground service.
 *
 * Responsibilities:
 * 1. Keep process alive so SmsBroadcastReceiver works on Samsung/Xiaomi
 * 2. Retry offline SMS queue when network becomes available
 * 3. Check for app updates at midnight daily
 */
class BootForegroundService : Service() {

    companion object {
        private const val TAG = "LiscordBootSvc"
        private const val CHANNEL_ID = "liscord_sms_monitor"
        private const val UPDATE_CHANNEL_ID = "liscord_update"
        private const val NOTIFICATION_ID = 9001
        private const val UPDATE_NOTIFICATION_ID = 9002
        private const val GITHUB_RELEASE_URL = "https://api.github.com/repos/oidovnamnan/liscord.com/releases/tags/bridge-latest"
        private const val QUEUE_RETRY_INTERVAL = 5 * 60 * 1000L // retry queue every 5 minutes
    }

    private val handler = Handler(Looper.getMainLooper())
    private var updateCheckRunnable: Runnable? = null
    private var queueRetryRunnable: Runnable? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        createUpdateChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "✅ Service started")

        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(this, 0, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        } else null

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Liscord Bridge")
            .setContentText("SMS хяналт идэвхтэй ✅")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        // Start periodic tasks
        startQueueRetry()
        startUpdateChecks()
        registerNetworkListener()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        updateCheckRunnable?.let { handler.removeCallbacks(it) }
        queueRetryRunnable?.let { handler.removeCallbacks(it) }
        unregisterNetworkListener()
        Log.w(TAG, "⚠️ Service destroyed")
    }

    // ====== OFFLINE QUEUE RETRY ======

    private fun startQueueRetry() {
        queueRetryRunnable?.let { handler.removeCallbacks(it) }

        val runnable = object : Runnable {
            override fun run() {
                thread {
                    try {
                        val remaining = SmsBroadcastReceiver.retryQueue(this@BootForegroundService)
                        if (remaining > 0) {
                            Log.i(TAG, "📦 $remaining SMS still queued, will retry")
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Queue retry error: ${e.message}")
                    }
                }
                handler.postDelayed(this, QUEUE_RETRY_INTERVAL)
            }
        }
        queueRetryRunnable = runnable
        // First retry after 30 seconds
        handler.postDelayed(runnable, 30000)
    }

    // ====== NETWORK CHANGE LISTENER ======

    private fun registerNetworkListener() {
        try {
            val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    Log.i(TAG, "🌐 Network available — retrying queue")
                    thread {
                        // Small delay to let connection stabilize
                        Thread.sleep(2000)
                        SmsBroadcastReceiver.retryQueue(this@BootForegroundService)
                    }
                }
            }
            networkCallback = callback
            cm.registerNetworkCallback(request, callback)
        } catch (e: Exception) {
            Log.w(TAG, "Network listener failed: ${e.message}")
        }
    }

    private fun unregisterNetworkListener() {
        try {
            networkCallback?.let {
                val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
                cm.unregisterNetworkCallback(it)
            }
            networkCallback = null
        } catch (_: Exception) {}
    }

    // ====== UPDATE CHECKER ======

    private fun startUpdateChecks() {
        updateCheckRunnable?.let { handler.removeCallbacks(it) }

        val runnable = object : Runnable {
            override fun run() {
                thread { checkForUpdate() }
                handler.postDelayed(this, msUntilMidnight())
            }
        }
        updateCheckRunnable = runnable
        val delayMs = msUntilMidnight()
        Log.i(TAG, "Next update check in ${delayMs / 3600000}h")
        handler.postDelayed(runnable, delayMs)
    }

    private fun msUntilMidnight(): Long {
        val now = Calendar.getInstance()
        val midnight = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return midnight.timeInMillis - now.timeInMillis
    }

    private fun checkForUpdate() {
        try {
            val url = URL(GITHUB_RELEASE_URL)
            val connection = url.openConnection() as HttpURLConnection
            connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
            connection.connectTimeout = 10000
            connection.readTimeout = 10000

            if (connection.responseCode != 200) {
                connection.disconnect(); return
            }

            val responseText = connection.inputStream.bufferedReader().readText()
            connection.disconnect()

            val json = JSONObject(responseText)
            val body = json.optString("body", "")
            val match = Regex("v(\\d+\\.\\d+)").find(body)
            val remoteVersion = match?.groupValues?.get(1) ?: return

            val prefs = getSharedPreferences("LiscordBridge", MODE_PRIVATE)
            val currentVersion = prefs.getString("appVersion", "1.6") ?: "1.6"

            if (remoteVersion != currentVersion) {
                showUpdateNotification(remoteVersion)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Update check failed: ${e.message}")
        }
    }

    private fun showUpdateNotification(version: String) {
        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        tapIntent?.putExtra("updateAvailable", version)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(this, 1, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        } else null

        val notification = NotificationCompat.Builder(this, UPDATE_CHANNEL_ID)
            .setContentTitle("🚀 Шинэ хувилбар v$version")
            .setContentText("Дарж шинэчлэнэ үү")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(UPDATE_NOTIFICATION_ID, notification)
    }

    // ====== CHANNELS ======

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "SMS Хяналт", NotificationManager.IMPORTANCE_MIN).apply {
                description = "SMS орлого хяналтын мэдэгдэл"
                setShowBadge(false)
                setSound(null, null)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createUpdateChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(UPDATE_CHANNEL_ID, "Шинэчлэл", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Апп шинэчлэлийн мэдэгдэл"
                setShowBadge(true)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
