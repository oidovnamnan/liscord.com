package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BootReceiver — triggered after device reboot.
 *
 * Starts a foreground service to keep the process alive on aggressive OEMs
 * (Xiaomi, Huawei, Oppo, Samsung) that kill broadcast receivers of "cold" apps.
 * 
 * Activity-based launch is blocked by many OEMs, so we use a foreground service instead.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LiscordBoot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
            intent.action == "com.htc.intent.action.QUICKBOOT_POWERON") {

            Log.i(TAG, "✅ Device booted — starting Liscord Bridge foreground service")

            try {
                val serviceIntent = Intent(context, BootForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.i(TAG, "✅ Foreground service started after boot")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to start foreground service: ${e.message}", e)
                // Fallback: try launching activity
                try {
                    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(launchIntent)
                        Log.i(TAG, "✅ Fallback: activity launched")
                    }
                } catch (e2: Exception) {
                    Log.e(TAG, "❌ Fallback also failed: ${e2.message}", e2)
                }
            }
        }
    }
}
