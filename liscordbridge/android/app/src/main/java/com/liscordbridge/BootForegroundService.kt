package com.liscordbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * BootForegroundService — a short-lived foreground service started after device boot.
 *
 * Purpose: On aggressive OEMs (Xiaomi, Huawei, Oppo, Samsung), starting a foreground service
 * after boot "wakes up" the app process, ensuring that the statically-registered
 * SmsBroadcastReceiver stays alive and can receive SMS_RECEIVED intents.
 *
 * This service shows a notification briefly, then stops itself after a few seconds.
 * The notification tells the user that LiscordBridge is active.
 */
class BootForegroundService : Service() {

    companion object {
        private const val TAG = "LiscordBootSvc"
        private const val CHANNEL_ID = "liscord_boot_channel"
        private const val NOTIFICATION_ID = 9001
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "✅ Boot foreground service started — keeping SMS receiver alive")

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Liscord Bridge")
            .setContentText("SMS хяналт идэвхтэй байна")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(false)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        // Stop self after 5 seconds — the static SMS receiver is already alive now
        Thread {
            Thread.sleep(5000)
            Log.i(TAG, "✅ Boot service stopping — SMS receiver is awake")
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }.start()

        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Liscord Bridge Boot",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Утас асахад SMS хяналтыг идэвхжүүлэх"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
