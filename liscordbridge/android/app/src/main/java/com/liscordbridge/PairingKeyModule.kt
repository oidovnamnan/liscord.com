package com.liscordbridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Native module to sync pairing key + SMS config from React Native to
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

    /**
     * Sync SMS config from Firestore templates to SharedPreferences.
     * Called from App.tsx after fetching business smsTemplates.
     * @param keywords Comma-separated income keywords (e.g., "orlogo,dungeer,guilgee")
     * @param senders Comma-separated bank sender numbers (e.g., "1900,132525,1800")
     */
    @ReactMethod
    fun setSmsConfig(keywords: String, senders: String) {
        val prefs = reactApplicationContext.getSharedPreferences("LiscordBridge", ReactApplicationContext.MODE_PRIVATE)
        prefs.edit()
            .putString("smsKeywords", keywords)
            .putString("smsSenders", senders)
            .apply()
    }

    /**
     * Sync full template data (JSON array) to SharedPreferences for native prefix/suffix parsing.
     * @param templatesJson JSON array of template objects with amountPrefix, amountSuffix, utgaPrefix, utgaSuffix, incomeKeywords
     */
    @ReactMethod
    fun setSmsTemplates(templatesJson: String) {
        val prefs = reactApplicationContext.getSharedPreferences("LiscordBridge", ReactApplicationContext.MODE_PRIVATE)
        prefs.edit()
            .putString("smsTemplates", templatesJson)
            .apply()
    }
}
