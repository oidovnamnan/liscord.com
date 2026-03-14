package com.liscordbridge

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ContentResolver
import android.content.Intent
import android.database.Cursor
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.Uri
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
 * BootForegroundService — the MAIN reliable SMS forwarding mechanism.
 *
 * Samsung/Xiaomi kills BroadcastReceivers via "deep sleep", but they CANNOT kill
 * a foreground service with a persistent notification.
 *
 * This service:
 * 1. Polls SMS inbox every 5 seconds for new bank SMS (ContentResolver)
 * 2. Forwards matching SMS to Firestore REST API
 * 3. Retries offline queue when network becomes available
 * 4. Checks for app updates at midnight
 */
class BootForegroundService : Service() {

    companion object {
        private const val TAG = "LiscordBootSvc"
        private const val CHANNEL_ID = "liscord_sms_monitor"
        private const val UPDATE_CHANNEL_ID = "liscord_update"
        private const val NOTIFICATION_ID = 9001
        private const val UPDATE_NOTIFICATION_ID = 9002
        private const val GITHUB_RELEASE_URL = "https://api.github.com/repos/oidovnamnan/liscord.com/releases/tags/bridge-latest"
        private const val SMS_POLL_INTERVAL = 5000L  // 5 seconds
    }

    private val handler = Handler(Looper.getMainLooper())
    private var smsPollRunnable: Runnable? = null
    private var updateCheckRunnable: Runnable? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var lastCheckedTimestamp = 0L  // millis of last SMS check
    private var totalForwarded = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        createUpdateChannel()
        // Restore last checked timestamp (don't reprocess old SMS)
        val prefs = getSharedPreferences(SmsBroadcastReceiver.PREFS_NAME, MODE_PRIVATE)
        lastCheckedTimestamp = prefs.getLong("lastSmsTimestamp", System.currentTimeMillis())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "✅ Service started — SMS polling active")

        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(this, 0, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        } else null

        updateNotification(pendingIntent, "SMS хяналт идэвхтэй ✅")
        startForeground(NOTIFICATION_ID, buildNotification(pendingIntent, "SMS хяналт идэвхтэй ✅"))

        // Start all periodic tasks
        startSmsPoll()
        startUpdateChecks()
        registerNetworkListener()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        smsPollRunnable?.let { handler.removeCallbacks(it) }
        updateCheckRunnable?.let { handler.removeCallbacks(it) }
        unregisterNetworkListener()
        Log.w(TAG, "⚠️ Service destroyed — scheduling restart")
        scheduleRestart()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.w(TAG, "⚠️ App swiped away — scheduling restart")
        scheduleRestart()
    }

    /**
     * Schedule service restart via AlarmManager — works even after force-stop on most OEMs.
     * Uses a 5-second delay to avoid rapid restart loops.
     */
    private fun scheduleRestart() {
        try {
            val restartIntent = Intent(this, BootForegroundService::class.java)
            val pendingIntent = PendingIntent.getService(
                this, 1, restartIntent,
                PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = getSystemService(ALARM_SERVICE) as AlarmManager
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 5000,
                pendingIntent
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule restart: ${e.message}")
        }
    }

    // ====== SMS POLLING (main forwarding mechanism) ======

    private fun startSmsPoll() {
        smsPollRunnable?.let { handler.removeCallbacks(it) }

        val runnable = object : Runnable {
            override fun run() {
                thread { pollSmsInbox() }
                handler.postDelayed(this, SMS_POLL_INTERVAL)
            }
        }
        smsPollRunnable = runnable
        handler.postDelayed(runnable, 3000) // start after 3 sec
    }

    private fun pollSmsInbox() {
        try {
            val prefs = getSharedPreferences(SmsBroadcastReceiver.PREFS_NAME, MODE_PRIVATE)
            val pairingKey = prefs.getString("pairingKey", null)
            if (pairingKey.isNullOrEmpty()) return

            val dynamicKeywords = prefs.getString("smsKeywords", null)
                ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
            val dynamicSenders = prefs.getString("smsSenders", null)
                ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
            val keywords = dynamicKeywords ?: listOf(
                "orlogo", "орлого", "орсон", "credited", "received",
                "dungeer", "дүнгээр", "dansand", "guilgee", "гүйлгээ",
                "hiigdlee", "хийгдлээ", "шилжүүлэг", "орлогын"
            )
            val bankSenders = dynamicSenders ?: listOf(
                "1900", "19001917", "19001918",
                "1800", "18001800", "132525",
                "1500", "15001500", "7575", "1234", "2525"
            )
            val templatesJson = prefs.getString("smsTemplates", null)

            // Query recent SMS inbox (since last check)
            val uri = Uri.parse("content://sms/inbox")
            val cursor: Cursor? = contentResolver.query(
                uri,
                arrayOf("_id", "address", "body", "date"),
                "date > ?",
                arrayOf(lastCheckedTimestamp.toString()),
                "date ASC"
            )

            cursor?.use {
                while (it.moveToNext()) {
                    val sender = it.getString(it.getColumnIndexOrThrow("address")) ?: ""
                    val body = it.getString(it.getColumnIndexOrThrow("body")) ?: ""
                    val date = it.getLong(it.getColumnIndexOrThrow("date"))

                    // Update timestamp
                    if (date > lastCheckedTimestamp) lastCheckedTimestamp = date

                    // Check if bank SMS
                    val isFromBank = bankSenders.any { b -> sender.contains(b) || b.contains(sender) }
                    val hasKeyword = keywords.any { k ->
                        body.lowercase().contains(k.lowercase())
                    } && Regex("\\d[\\d,.]*").containsMatchIn(body)

                    if (!isFromBank && !hasKeyword) continue

                    // Parse
                    var amount = parseAmountWithTemplates(body, templatesJson)
                    val bank = parseBankName(sender, body)
                    var utga = parseUtgaWithTemplates(body, templatesJson)
                    if (amount <= 0) amount = parseAmountFallback(body)
                    if (utga.isEmpty()) utga = parseUtgaFallback(body)

                    Log.i(TAG, "📤 SMS poll: amount=$amount, bank=$bank, utga=$utga")

                    val success = SmsBroadcastReceiver.sendToFirestore(
                        pairingKey, sender, body, amount, bank, utga, date
                    )
                    if (success) {
                        totalForwarded++
                        // Update notification
                        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)
                        val pi = if (tapIntent != null) {
                            PendingIntent.getActivity(this, 0, tapIntent,
                                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                        } else null
                        updateNotification(pi, "📤 $totalForwarded дамжуулсан")
                    } else {
                        SmsBroadcastReceiver.enqueue(
                            this, pairingKey, sender, body, amount, bank, utga, date
                        )
                    }
                }
            }

            // Also persist lastCheckedTimestamp so it survives restarts
            prefs.edit().putLong("lastSmsTimestamp", lastCheckedTimestamp).apply()

        } catch (e: Exception) {
            Log.e(TAG, "SMS poll error: ${e.message}")
        }
    }

    // ====== PARSING HELPERS (same logic as SmsBroadcastReceiver) ======

    private fun parseAmountWithTemplates(body: String, templatesJson: String?): Double {
        if (templatesJson.isNullOrEmpty()) return 0.0
        try {
            val templates = org.json.JSONArray(templatesJson)
            for (i in 0 until templates.length()) {
                val tmpl = templates.getJSONObject(i)
                val prefix = tmpl.optString("amountPrefix", "")
                if (prefix.isEmpty()) continue
                val kws = tmpl.optJSONArray("incomeKeywords")
                var match = false
                if (kws != null) {
                    for (k in 0 until kws.length()) {
                        if (body.lowercase().contains(kws.optString(k, "").lowercase())) { match = true; break }
                    }
                }
                if (!match) continue
                val suffix = tmpl.optString("amountSuffix", "")
                val result = parseWithMarkers(body, prefix, suffix)
                if (result.isNotEmpty()) {
                    val v = result.replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                    if (v > 0) return v
                }
            }
        } catch (_: Exception) {}
        return 0.0
    }

    private fun parseUtgaWithTemplates(body: String, templatesJson: String?): String {
        if (templatesJson.isNullOrEmpty()) return ""
        try {
            val templates = org.json.JSONArray(templatesJson)
            for (i in 0 until templates.length()) {
                val tmpl = templates.getJSONObject(i)
                val prefix = tmpl.optString("utgaPrefix", "")
                if (prefix.isEmpty()) continue
                val kws = tmpl.optJSONArray("incomeKeywords")
                var match = false
                if (kws != null) {
                    for (k in 0 until kws.length()) {
                        if (body.lowercase().contains(kws.optString(k, "").lowercase())) { match = true; break }
                    }
                }
                if (!match) continue
                val suffix = tmpl.optString("utgaSuffix", "")
                val result = parseWithMarkers(body, prefix, suffix)
                if (result.isNotEmpty()) return result
            }
        } catch (_: Exception) {}
        return ""
    }

    private fun parseWithMarkers(text: String, prefix: String, suffix: String): String {
        if (prefix.isEmpty()) return ""
        val lower = text.lowercase()
        val pi = lower.indexOf(prefix.lowercase())
        if (pi == -1) return ""
        val start = pi + prefix.length
        if (suffix.isEmpty()) {
            val rest = text.substring(start)
            val end = Regex("[\\n]|,\\s|\\.\\s\\s").find(rest)
            return if (end != null) rest.substring(0, end.range.first).trim() else rest.trim()
        }
        val si = lower.indexOf(suffix.lowercase(), start)
        if (si == -1) {
            val rest = text.substring(start)
            val nl = rest.indexOf('\n')
            return if (nl > -1) rest.substring(0, nl).trim() else rest.trim()
        }
        return text.substring(start, si).trim()
    }

    private fun parseAmountFallback(body: String): Double {
        val txnPatterns = listOf(
            Regex("(?:guilgeenii\\s*dun|гүйлгээний\\s*(?:дүн|дүнгээр))[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
            Regex("(?:orlogo|орлого)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
            Regex("(?:dun|дүн)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
        )
        for (p in txnPatterns) {
            val m = p.find(body)
            if (m != null) {
                val v = m.groupValues[1].replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                if (v > 0) return v
            }
        }
        val mntMatch = Regex("(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)", RegexOption.IGNORE_CASE).find(body)
        if (mntMatch != null) {
            val idx = mntMatch.range.first
            val before = body.substring(maxOf(0, idx - 30), idx).lowercase()
            if (!before.contains("uldegdel") && !before.contains("үлдэгдэл")) {
                val v = mntMatch.groupValues[1].replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                if (v > 0) return v
            }
        }
        val numbers = Regex("\\d[\\d,]*(?:\\.\\d{1,2})?").findAll(body)
            .mapNotNull { it.value.replace(",", "").toDoubleOrNull() }
            .filter { it > 100 }.sortedDescending().toList()
        return if (numbers.size >= 2) numbers[1] else numbers.firstOrNull() ?: 0.0
    }

    private fun parseBankName(sender: String, body: String): String {
        if (sender.contains("1900") || sender.contains("19001917")) return "Khan Bank"
        if (sender.contains("132525") || sender.contains("18001800")) return "Golomt"
        if (sender.contains("1800")) return "Golomt"
        if (sender.contains("15001500") || sender.contains("1500")) return "TDB"
        if (sender.contains("7575")) return "XacBank"
        if (sender.contains("1234")) return "Төрийн Банк"
        if (sender.contains("2525")) return "Bogd Bank"
        val lower = body.lowercase()
        if (lower.contains("khan") || lower.contains("хаан")) return "Khan Bank"
        if (lower.contains("golomt") || lower.contains("голомт")) return "Golomt"
        if (lower.contains("tdb") || lower.contains("худалдаа")) return "TDB"
        return "Банк ($sender)"
    }

    private fun parseUtgaFallback(body: String): String {
        val patterns = listOf(
            Regex("(?:guilgeenii\\s*)?utga[:\\s]*([^\\n,.]+)", RegexOption.IGNORE_CASE),
            Regex("(?:гүйлгээний\\s*)?утга[:\\s]*([^\\n,.]+)", RegexOption.IGNORE_CASE),
        )
        for (p in patterns) {
            val m = p.find(body)
            if (m != null) return m.groupValues[1].trim()
        }
        return ""
    }

    // ====== NOTIFICATION ======

    private fun buildNotification(pendingIntent: PendingIntent?, text: String) =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Liscord Bridge")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(pendingIntent)
            .build()

    private fun updateNotification(pendingIntent: PendingIntent?, text: String) {
        try {
            val manager = getSystemService(NotificationManager::class.java)
            manager.notify(NOTIFICATION_ID, buildNotification(pendingIntent, text))
        } catch (_: Exception) {}
    }

    // ====== OFFLINE QUEUE RETRY ======

    private fun registerNetworkListener() {
        try {
            val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    Log.i(TAG, "🌐 Network back — retrying queue")
                    thread {
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
                (getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager).unregisterNetworkCallback(it)
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
        handler.postDelayed(runnable, msUntilMidnight())
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
            val conn = url.openConnection() as HttpURLConnection
            conn.setRequestProperty("Accept", "application/vnd.github.v3+json")
            conn.connectTimeout = 10000
            conn.readTimeout = 10000
            if (conn.responseCode != 200) { conn.disconnect(); return }
            val body = conn.inputStream.bufferedReader().readText()
            conn.disconnect()
            val json = JSONObject(body)
            val match = Regex("v(\\d+\\.\\d+)").find(json.optString("body", ""))
            val remoteVersion = match?.groupValues?.get(1) ?: return
            val prefs = getSharedPreferences("LiscordBridge", MODE_PRIVATE)
            val currentVersion = prefs.getString("appVersion", "1.6") ?: "1.6"
            if (remoteVersion != currentVersion) showUpdateNotification(remoteVersion)
        } catch (_: Exception) {}
    }

    private fun showUpdateNotification(version: String) {
        val tapIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            putExtra("updateAvailable", version)
        }
        val pi = if (tapIntent != null) {
            PendingIntent.getActivity(this, 1, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        } else null
        val n = NotificationCompat.Builder(this, UPDATE_CHANNEL_ID)
            .setContentTitle("🚀 Шинэ хувилбар v$version")
            .setContentText("Дарж шинэчлэнэ үү")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()
        getSystemService(NotificationManager::class.java).notify(UPDATE_NOTIFICATION_ID, n)
    }

    // ====== CHANNELS ======

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "SMS Хяналт", NotificationManager.IMPORTANCE_MIN).apply {
                description = "SMS орлого хяналтын мэдэгдэл"
                setShowBadge(false); setSound(null, null)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createUpdateChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(UPDATE_CHANNEL_ID, "Шинэчлэл", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Апп шинэчлэлийн мэдэгдэл"; setShowBadge(true)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
