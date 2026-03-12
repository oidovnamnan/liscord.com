package com.liscordbridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * BootForegroundService — a PERSISTENT foreground service started after device boot.
 *
 * Samsung OneUI, Xiaomi MIUI, and other aggressive OEMs put apps in "deep sleep"
 * which kills even statically-registered BroadcastReceivers (SMS_RECEIVED).
 *
 * This service keeps a persistent notification showing "SMS monitoring active"
 * which prevents the OS from killing the app process. This ensures that the
 * SmsBroadcastReceiver continues to receive SMS_RECEIVED intents.
 *
 * The notification has a "tap to open" action that launches the main app.
 */
class BootForegroundService : Service() {

    companion object {
        private const val TAG = "LiscordBootSvc"
        private const val CHANNEL_ID = "liscord_sms_monitor"
        private const val NOTIFICATION_ID = 9001
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
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

        // START_STICKY = restart service if killed by OS
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.w(TAG, "⚠️ Service destroyed — SMS monitoring may stop")
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
}
