package com.liscordbridge

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  companion object {
      private const val TAG = "LiscordMain"
  }

  override fun getMainComponentName(): String = "liscordbridge"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      // Always ensure the SMS monitor service is running when user opens the app
      try {
          val serviceIntent = Intent(this, BootForegroundService::class.java)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              startForegroundService(serviceIntent)
          } else {
              startService(serviceIntent)
          }
          Log.i(TAG, "✅ SMS monitor service started from MainActivity")
      } catch (e: Exception) {
          Log.e(TAG, "⚠️ Could not start monitor service: ${e.message}")
      }

      // Request battery optimization exemption (prevents Samsung/Xiaomi from killing service)
      requestBatteryOptimizationExemption()
  }

  /**
   * Request the user to disable battery optimization for this app.
   * Without this, Samsung OneUI / Xiaomi MIUI / Huawei EMUI will kill the
   * foreground service during "deep sleep" — causing SMS forwarding to stop.
   */
  private fun requestBatteryOptimizationExemption() {
      try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
              val pm = getSystemService(POWER_SERVICE) as PowerManager
              if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                  val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                      data = Uri.parse("package:$packageName")
                  }
                  startActivity(intent)
                  Log.i(TAG, "🔋 Battery optimization exemption requested")
              } else {
                  Log.i(TAG, "✅ Battery optimization already disabled")
              }
          }
      } catch (e: Exception) {
          Log.w(TAG, "Battery optimization request failed: ${e.message}")
      }
  }
}
