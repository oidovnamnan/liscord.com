package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BootReceiver — triggered after device reboot or app update.
 *
 * Starts a persistent foreground service to keep the process alive on Samsung OneUI,
 * Xiaomi MIUI, Huawei EMUI, and other aggressive battery-optimizing OEMs.
 *
 * Handles:
 * - BOOT_COMPLETED (normal boot)
 * - LOCKED_BOOT_COMPLETED (direct boot, before user unlocks)
 * - QUICKBOOT_POWERON (vendor-specific quick boot)
 * - MY_PACKAGE_REPLACED (after app update)
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LiscordBoot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED) {

            Log.i(TAG, "✅ Received: $action — starting SMS monitor service")

            try {
                val serviceIntent = Intent(context, BootForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                Log.i(TAG, "✅ SMS monitor service started successfully")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Service start failed: ${e.message}", e)
                // Fallback: try launching activity
                try {
                    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(launchIntent)
                        Log.i(TAG, "✅ Fallback: activity launched")
                    }
                } catch (e2: Exception) {
                    Log.e(TAG, "❌ All start methods failed: ${e2.message}", e2)
                }
            }
        }
    }
}
