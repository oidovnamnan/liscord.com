package com.liscordbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Simple native module to sync pairing key from React Native to
 * SharedPreferences, where the SmsBroadcastReceiver can read it.
 */
class PairingKeyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PairingKeyModule"

    @ReactMethod
    fun setPairingKey(key: String) {
        val prefs = reactApplicationContext.getSharedPreferences("LiscordBridge", ReactApplicationContext.MODE_PRIVATE)
        prefs.edit().putString("pairingKey", key).apply()
    }

    @ReactMethod
    fun clearPairingKey() {
        val prefs = reactApplicationContext.getSharedPreferences("LiscordBridge", ReactApplicationContext.MODE_PRIVATE)
        prefs.edit().remove("pairingKey").apply()
    }
}
