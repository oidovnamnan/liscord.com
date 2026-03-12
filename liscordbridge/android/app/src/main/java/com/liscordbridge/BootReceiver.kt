package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BootReceiver — triggered after device reboot.
 * 
 * Ensures the Liscord Bridge app is started after the device boots up,
 * so the SmsBroadcastReceiver continues to receive and forward SMS income messages.
 * 
 * On modern Android (8+), we launch the main activity to ensure the process is alive.
 * The static SMS_RECEIVED receiver in the manifest should work regardless,
 * but some OEMs (Xiaomi, Huawei, Samsung) kill receivers of apps that haven't been
 * "started" since boot — launching the activity resolves this.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LiscordBoot"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
            intent.action == "com.htc.intent.action.QUICKBOOT_POWERON") {

            Log.i(TAG, "✅ Device booted — starting Liscord Bridge to keep SMS receiver alive")

            try {
                val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                    Log.i(TAG, "✅ Liscord Bridge launched successfully after boot")
                } else {
                    Log.w(TAG, "⚠️ Could not get launch intent")
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to launch after boot: ${e.message}", e)
            }
        }
    }
}
