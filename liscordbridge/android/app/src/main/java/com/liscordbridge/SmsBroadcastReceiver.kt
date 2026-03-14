package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.telephony.SmsMessage
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.concurrent.thread

/**
 * Native BroadcastReceiver for SMS_RECEIVED.
 * 
 * ARCHITECTURE:
 * 1. SMS arrives → Android triggers onReceive() (even when app is killed)
 * 2. goAsync() extends processing window to ~30 seconds
 * 3. WakeLock prevents CPU sleep during network call
 * 4. Parse SMS → extract amount/bank/utga using prefix/suffix templates
 * 5. Try to send to Firestore REST API
 * 6. If send fails (no internet, timeout, etc) → save to offline queue in SharedPreferences
 * 7. BootForegroundService periodically retries the offline queue
 */
class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "LiscordSMS"
        const val FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/liscord-2b529/databases/(default)/documents"
        const val PREFS_NAME = "LiscordBridge"
        const val QUEUE_KEY = "offlineQueue"
        
        private val DEFAULT_KEYWORDS = listOf(
            "orlogo", "орлого", "орсон", "credited", "received",
            "dungeer", "дүнгээр", "dansand", "guilgee", "гүйлгээ",
            "hiigdlee", "хийгдлээ", "шилжүүлэг", "орлогын"
        )
        
        private val DEFAULT_BANK_SENDERS = listOf(
            "1900", "19001917", "19001918",
            "1800", "18001800", "132525",
            "1500", "15001500",
            "7575", "1234", "2525"
        )

        /**
         * Try sending a single SMS doc to Firestore. Returns true on success.
         */
        fun sendToFirestore(pairingKey: String, sender: String, body: String,
                            amount: Double, bank: String, utga: String, timestamp: Long): Boolean {
            return try {
                val bodyHash = body.take(50).replace(Regex("[^a-zA-Z0-9]"), "").take(20)
                val timeKey = timestamp / 60000
                val docId = "sms_${sender}_${timeKey}_${bodyHash}"
                val url = URL("$FIRESTORE_BASE/sms_inbox/$docId")
                val isoDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

                val fields = JSONObject().apply {
                    put("pairingKey", JSONObject().put("stringValue", pairingKey))
                    put("sender", JSONObject().put("stringValue", sender))
                    put("body", JSONObject().put("stringValue", body))
                    put("bank", JSONObject().put("stringValue", bank))
                    put("amount", JSONObject().put("doubleValue", amount))
                    put("utga", JSONObject().put("stringValue", utga))
                    put("timestamp", JSONObject().put("integerValue", timestamp.toString()))
                    put("status", JSONObject().put("stringValue", "pending"))
                    put("source", JSONObject().put("stringValue", "native_receiver"))
                    put("createdAt", JSONObject().put("timestampValue", isoDate))
                }

                val doc = JSONObject().put("fields", fields)

                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "PATCH"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(doc.toString())
                    writer.flush()
                }

                val responseCode = connection.responseCode
                connection.disconnect()
                
                if (responseCode in 200..299) {
                    Log.i(TAG, "✅ SMS → Firestore: amount=$amount, bank=$bank")
                    true
                } else {
                    Log.e(TAG, "❌ Firestore HTTP $responseCode")
                    false
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Firestore fail: ${e.message}")
                false
            }
        }

        /**
         * Add a failed SMS to the offline queue (SharedPreferences).
         */
        fun enqueue(context: Context, pairingKey: String, sender: String, body: String,
                    amount: Double, bank: String, utga: String, timestamp: Long) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existing = prefs.getString(QUEUE_KEY, "[]") ?: "[]"
            val queue = try { JSONArray(existing) } catch (_: Exception) { JSONArray() }

            val item = JSONObject().apply {
                put("pairingKey", pairingKey)
                put("sender", sender)
                put("body", body)
                put("amount", amount)
                put("bank", bank)
                put("utga", utga)
                put("timestamp", timestamp)
                put("queuedAt", System.currentTimeMillis())
            }
            queue.put(item)
            
            // Keep max 50 items to prevent SharedPreferences bloat
            while (queue.length() > 50) queue.remove(0)
            
            prefs.edit().putString(QUEUE_KEY, queue.toString()).apply()
            Log.i(TAG, "📦 Queued SMS (${queue.length()} in queue)")
        }

        /**
         * Retry all items in the offline queue. Returns number of items remaining.
         */
        fun retryQueue(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existing = prefs.getString(QUEUE_KEY, "[]") ?: "[]"
            val queue = try { JSONArray(existing) } catch (_: Exception) { JSONArray() }
            
            if (queue.length() == 0) return 0
            
            Log.i(TAG, "🔄 Retrying ${queue.length()} queued SMS...")
            val remaining = JSONArray()

            for (i in 0 until queue.length()) {
                val item = queue.getJSONObject(i)
                // Skip items older than 24 hours
                val queuedAt = item.optLong("queuedAt", 0)
                if (queuedAt > 0 && System.currentTimeMillis() - queuedAt > 24 * 60 * 60 * 1000) {
                    Log.w(TAG, "⏰ Dropping queued SMS older than 24h")
                    continue
                }

                val success = sendToFirestore(
                    item.getString("pairingKey"),
                    item.getString("sender"),
                    item.getString("body"),
                    item.getDouble("amount"),
                    item.getString("bank"),
                    item.optString("utga", ""),
                    item.getLong("timestamp")
                )
                if (!success) remaining.put(item)
            }

            prefs.edit().putString(QUEUE_KEY, remaining.toString()).apply()
            Log.i(TAG, "Queue: ${remaining.length()} remaining (was ${queue.length()})")
            return remaining.length()
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return

        val pendingResult = goAsync()
        val bundle: Bundle = intent.extras ?: run { pendingResult.finish(); return }
        val pdus = bundle.get("pdus") as? Array<*> ?: run { pendingResult.finish(); return }
        val format = bundle.getString("format", "3gpp")

        // Reconstruct full message (multi-part SMS)
        val messageMap = mutableMapOf<String, StringBuilder>()
        for (pdu in pdus) {
            val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray, format) ?: continue
            val addr = smsMessage.displayOriginatingAddress ?: smsMessage.originatingAddress ?: ""
            if (messageMap[addr] == null) messageMap[addr] = StringBuilder()
            messageMap[addr]?.append(smsMessage.displayMessageBody ?: "")
        }

        // Ensure foreground service is running
        ensureForegroundService(context)

        // Acquire WakeLock
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LiscordBridge:SmsWakeLock")
        wakeLock.acquire(30000)

        thread {
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val pairingKey = prefs.getString("pairingKey", null)
                if (pairingKey.isNullOrEmpty()) {
                    Log.w(TAG, "No pairing key, skipping")
                    return@thread
                }

                val dynamicKeywords = prefs.getString("smsKeywords", null)
                    ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
                val dynamicSenders = prefs.getString("smsSenders", null)
                    ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
                val keywords = dynamicKeywords ?: DEFAULT_KEYWORDS
                val bankSenders = dynamicSenders ?: DEFAULT_BANK_SENDERS
                val templatesJson = prefs.getString("smsTemplates", null)

                for ((sender, bodyBuilder) in messageMap) {
                    val body = bodyBuilder.toString()
                    Log.d(TAG, "SMS from: $sender")

                    val isFromBank = bankSenders.any { sender.contains(it) || it.contains(sender) }
                    val hasKeyword = keywords.any {
                        body.lowercase().contains(it.lowercase())
                    } && Regex("\\d[\\d,.]*").containsMatchIn(body)

                    if (!isFromBank && !hasKeyword) {
                        Log.d(TAG, "Not bank SMS, skip")
                        continue
                    }

                    var amount = parseAmountWithTemplates(body, templatesJson)
                    val bank = parseBankName(sender, body)
                    var utga = parseUtgaWithTemplates(body, templatesJson)
                    if (amount <= 0) amount = parseAmount(body)
                    if (utga.isEmpty()) utga = parseUtga(body)
                    val ts = System.currentTimeMillis()

                    Log.i(TAG, "📤 amount=$amount, bank=$bank, utga=$utga")

                    // Try sending — if fails, queue for retry
                    val success = sendToFirestore(pairingKey, sender, body, amount, bank, utga, ts)
                    if (!success) {
                        enqueue(context, pairingKey, sender, body, amount, bank, utga, ts)
                    }
                }

                // Also try to flush any previously queued items
                retryQueue(context)

            } catch (e: Exception) {
                Log.e(TAG, "❌ Error: ${e.message}", e)
            } finally {
                if (wakeLock.isHeld) wakeLock.release()
                pendingResult.finish()
            }
        }
    }

    private fun ensureForegroundService(context: Context) {
        try {
            val si = Intent(context, BootForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(si)
            } else {
                context.startService(si)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not start service: ${e.message}")
        }
    }

    // ====== TEMPLATE-BASED PARSING ======

    private fun parseAmountWithTemplates(body: String, templatesJson: String?): Double {
        if (templatesJson.isNullOrEmpty()) return 0.0
        try {
            val templates = JSONArray(templatesJson)
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
            val templates = JSONArray(templatesJson)
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

    // ====== FALLBACK REGEX PARSING ======

    private fun parseAmount(body: String): Double {
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
            if (!before.contains("uldegdel") && !before.contains("үлдэгдэл") && !before.contains("balance")) {
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
        if (lower.contains("xac") || lower.contains("хас")) return "XacBank"
        if (lower.contains("state") || lower.contains("төрийн")) return "Төрийн Банк"
        if (lower.contains("bogd") || lower.contains("богд")) return "Bogd Bank"
        if (Regex("orlogo|орлого|dungeer|guilgee", RegexOption.IGNORE_CASE).containsMatchIn(body)) return "Банк ($sender)"
        return sender
    }

    private fun parseUtga(body: String): String {
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
}
