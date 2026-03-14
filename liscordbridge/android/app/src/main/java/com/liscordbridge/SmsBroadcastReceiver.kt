package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.telephony.SmsMessage
import android.util.Log
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
 * Triggered by Android system when SMS arrives — works even when app is in background/killed.
 * 
 * Key design decisions:
 * - Uses goAsync() for extended processing time (up to 10 seconds vs default 5)
 * - Acquires WakeLock to prevent CPU sleep during REST API call
 * - Restarts BootForegroundService if not running (Samsung OneUI kills services)
 * - Reads pairing key + template config from SharedPreferences
 * - Uses prefix/suffix text markers for parsing (synced from Firestore templates)
 * - Makes Firestore REST API call directly in Kotlin — no JS engine needed
 */
class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "LiscordSMS"
        private const val FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/liscord-2b529/databases/(default)/documents"
        
        // Fallback keywords — used if no dynamic config from Firestore
        private val DEFAULT_KEYWORDS = listOf(
            "orlogo", "орлого", "орсон", "credited", "received",
            "dungeer", "дүнгээр", "dansand", "guilgee", "гүйлгээ",
            "hiigdlee", "хийгдлээ", "шилжүүлэг", "орлогын"
        )
        
        private val DEFAULT_BANK_SENDERS = listOf(
            "1900", "19001917", "19001918",  // Khan Bank
            "1800", "18001800", "132525",    // Golomt
            "1500", "15001500",              // TDB
            "7575",                          // XacBank
            "1234",                          // Төрийн
            "2525"                           // Bogd
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return

        // Use goAsync() for extended processing time (10s instead of 5s)
        val pendingResult = goAsync()

        val bundle: Bundle = intent.extras ?: run { pendingResult.finish(); return }
        val pdus = bundle.get("pdus") as? Array<*> ?: run { pendingResult.finish(); return }
        val format = bundle.getString("format", "3gpp")

        // Reconstruct full message (multi-part SMS)
        val messageMap = mutableMapOf<String, StringBuilder>()
        var senderAddress = ""

        for (pdu in pdus) {
            val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray, format) ?: continue
            senderAddress = smsMessage.displayOriginatingAddress ?: smsMessage.originatingAddress ?: ""
            
            if (messageMap[senderAddress] == null) {
                messageMap[senderAddress] = StringBuilder()
            }
            messageMap[senderAddress]?.append(smsMessage.displayMessageBody ?: "")
        }

        // Ensure BootForegroundService is running (Samsung kills it)
        ensureForegroundService(context)

        // Acquire WakeLock to keep CPU alive during Firestore write
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "LiscordBridge:SmsWakeLock"
        )
        wakeLock.acquire(30000) // 30 second timeout

        thread {
            try {
                for ((sender, bodyBuilder) in messageMap) {
                    val body = bodyBuilder.toString()
                    
                    Log.d(TAG, "SMS received from: $sender")

                    // Read dynamic config from SharedPreferences (synced from Firestore)
                    val prefs = context.getSharedPreferences("LiscordBridge", Context.MODE_PRIVATE)
                    val dynamicKeywords = prefs.getString("smsKeywords", null)
                        ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
                    val dynamicSenders = prefs.getString("smsSenders", null)
                        ?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
                    
                    val keywords = dynamicKeywords ?: DEFAULT_KEYWORDS
                    val bankSenders = dynamicSenders ?: DEFAULT_BANK_SENDERS

                    // Check if SMS is from a known bank sender OR has income keyword
                    val isFromBank = bankSenders.any { sender.contains(it) || it.contains(sender) }
                    val hasKeyword = isIncomeSms(body, keywords)
                    
                    if (!isFromBank && !hasKeyword) {
                        Log.d(TAG, "Not a bank SMS, skipping")
                        continue
                    }

                    val pairingKey = prefs.getString("pairingKey", null)

                    if (pairingKey.isNullOrEmpty()) {
                        Log.w(TAG, "No pairing key found, skipping")
                        continue
                    }

                    // Load template prefix/suffix from SharedPreferences
                    val templatesJson = prefs.getString("smsTemplates", null)
                    var amount = parseAmountWithTemplates(body, templatesJson)
                    val bank = parseBankName(sender, body)
                    var utga = parseUtgaWithTemplates(body, templatesJson)

                    // Fallback to hardcoded parsing if templates failed
                    if (amount <= 0) amount = parseAmount(body)
                    if (utga.isEmpty()) utga = parseUtga(body)

                    Log.i(TAG, "📤 Forwarding: amount=$amount, bank=$bank, utga=$utga")

                    sendToFirestore(pairingKey, sender, body, amount, bank, utga)
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ SMS processing error: ${e.message}", e)
            } finally {
                if (wakeLock.isHeld) wakeLock.release()
                pendingResult.finish()
            }
        }
    }

    /**
     * Ensure BootForegroundService is running — restart if Samsung/Xiaomi killed it.
     */
    private fun ensureForegroundService(context: Context) {
        try {
            val serviceIntent = Intent(context, BootForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not restart foreground service: ${e.message}")
        }
    }

    private fun isIncomeSms(body: String, keywords: List<String>): Boolean {
        val lower = body.lowercase()
        val hasKeyword = keywords.any { lower.contains(it.lowercase()) }
        val hasAmount = Regex("\\d[\\d,.]*").containsMatchIn(body)
        return hasKeyword && hasAmount
    }

    /**
     * Parse amount using prefix/suffix markers from saved templates.
     */
    private fun parseAmountWithTemplates(body: String, templatesJson: String?): Double {
        if (templatesJson.isNullOrEmpty()) return 0.0
        try {
            val templates = org.json.JSONArray(templatesJson)
            for (i in 0 until templates.length()) {
                val tmpl = templates.getJSONObject(i)
                val prefix = tmpl.optString("amountPrefix", "")
                val suffix = tmpl.optString("amountSuffix", "")
                if (prefix.isEmpty()) continue

                // Check if body has any of the template's income keywords
                val keywords = tmpl.optJSONArray("incomeKeywords")
                var hasKeyword = false
                if (keywords != null) {
                    for (k in 0 until keywords.length()) {
                        if (body.lowercase().contains(keywords.optString(k, "").lowercase())) {
                            hasKeyword = true
                            break
                        }
                    }
                }
                if (!hasKeyword) continue

                val result = parseWithMarkers(body, prefix, suffix)
                if (result.isNotEmpty()) {
                    val value = result.replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                    if (value > 0) return value
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Template amount parse error: ${e.message}")
        }
        return 0.0
    }

    /**
     * Parse utga using prefix/suffix markers from saved templates.
     */
    private fun parseUtgaWithTemplates(body: String, templatesJson: String?): String {
        if (templatesJson.isNullOrEmpty()) return ""
        try {
            val templates = org.json.JSONArray(templatesJson)
            for (i in 0 until templates.length()) {
                val tmpl = templates.getJSONObject(i)
                val prefix = tmpl.optString("utgaPrefix", "")
                if (prefix.isEmpty()) continue

                // Check keywords
                val keywords = tmpl.optJSONArray("incomeKeywords")
                var hasKeyword = false
                if (keywords != null) {
                    for (k in 0 until keywords.length()) {
                        if (body.lowercase().contains(keywords.optString(k, "").lowercase())) {
                            hasKeyword = true
                            break
                        }
                    }
                }
                if (!hasKeyword) continue

                val suffix = tmpl.optString("utgaSuffix", "")
                val result = parseWithMarkers(body, prefix, suffix)
                if (result.isNotEmpty()) return result
            }
        } catch (e: Exception) {
            Log.w(TAG, "Template utga parse error: ${e.message}")
        }
        return ""
    }

    /**
     * Parse text between prefix and suffix markers (case-insensitive).
     */
    private fun parseWithMarkers(text: String, prefix: String, suffix: String): String {
        if (prefix.isEmpty()) return ""
        val lower = text.lowercase()
        val prefixLower = prefix.lowercase()
        val prefixIdx = lower.indexOf(prefixLower)
        if (prefixIdx == -1) return ""

        val startIdx = prefixIdx + prefix.length

        if (suffix.isEmpty()) {
            // No suffix: take until newline, ", " or ".  "
            val rest = text.substring(startIdx)
            val endMatch = Regex("[\\n]|,\\s|\\.\\s\\s").find(rest)
            return if (endMatch != null) rest.substring(0, endMatch.range.first).trim() else rest.trim()
        }

        val suffixLower = suffix.lowercase()
        val suffixIdx = lower.indexOf(suffixLower, startIdx)
        if (suffixIdx == -1) {
            val rest = text.substring(startIdx)
            val nlIdx = rest.indexOf('\n')
            return if (nlIdx > -1) rest.substring(0, nlIdx).trim() else rest.trim()
        }

        return text.substring(startIdx, suffixIdx).trim()
    }

    private fun parseAmount(body: String): Double {
        // Priority 1: Amount near 'guilgeenii dun' / 'гүйлгээний дүн'
        val txnPatterns = listOf(
            Regex("(?:guilgeenii\\s*dun|гүйлгээний\\s*(?:дүн|дүнгээр))[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
            Regex("(?:orlogo|орлого)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
            Regex("(?:dun|дүн)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)?", RegexOption.IGNORE_CASE),
        )
        for (pattern in txnPatterns) {
            val match = pattern.find(body)
            if (match != null) {
                val value = match.groupValues[1].replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                if (value > 0) return value
            }
        }
        // Priority 2: Number + MNT, but skip if preceded by 'uldegdel/үлдэгдэл'
        val mntMatch = Regex("(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)", RegexOption.IGNORE_CASE).find(body)
        if (mntMatch != null) {
            val idx = mntMatch.range.first
            val before = body.substring(maxOf(0, idx - 30), idx).lowercase()
            if (!before.contains("uldegdel") && !before.contains("үлдэгдэл") && !before.contains("balance")) {
                val value = mntMatch.groupValues[1].replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                if (value > 0) return value
            }
        }
        // Priority 3: Second-largest number > 100 (largest is usually balance)
        val numbers = Regex("\\d[\\d,]*(?:\\.\\d{1,2})?").findAll(body)
            .mapNotNull { it.value.replace(",", "").toDoubleOrNull() }
            .filter { it > 100 }
            .sortedDescending()
            .toList()
        return if (numbers.size >= 2) numbers[1] else numbers.firstOrNull() ?: 0.0
    }

    private fun parseBankName(sender: String, body: String): String {
        // Check sender — longer numbers BEFORE shorter to avoid partial matches
        if (sender.contains("1900") || sender.contains("19001917")) return "Khan Bank"
        if (sender.contains("132525") || sender.contains("18001800")) return "Golomt"
        if (sender.contains("1800")) return "Golomt"
        if (sender.contains("15001500") || sender.contains("1500")) return "TDB"
        if (sender.contains("7575")) return "XacBank"
        if (sender.contains("1234")) return "Төрийн Банк"
        if (sender.contains("2525")) return "Bogd Bank"
        
        // Check body
        val lower = body.lowercase()
        if (lower.contains("khan") || lower.contains("хаан")) return "Khan Bank"
        if (lower.contains("golomt") || lower.contains("голомт")) return "Golomt"
        if (lower.contains("tdb") || lower.contains("худалдаа")) return "TDB"
        if (lower.contains("xac") || lower.contains("хас")) return "XacBank"
        if (lower.contains("state") || lower.contains("төрийн")) return "Төрийн Банк"
        if (lower.contains("bogd") || lower.contains("богд")) return "Bogd Bank"
        
        if (Regex("orlogo|орлого|dungeer|guilgee", RegexOption.IGNORE_CASE).containsMatchIn(body)) {
            return "Банк ($sender)"
        }
        return sender
    }

    private fun parseUtga(body: String): String {
        val patterns = listOf(
            Regex("(?:guilgeenii\\s*)?utga[:\\s]*([^\\n,.]+)", RegexOption.IGNORE_CASE),
            Regex("(?:гүйлгээний\\s*)?утга[:\\s]*([^\\n,.]+)", RegexOption.IGNORE_CASE),
        )
        for (pattern in patterns) {
            val match = pattern.find(body)
            if (match != null) return match.groupValues[1].trim()
        }
        return ""
    }

    private fun sendToFirestore(
        pairingKey: String,
        sender: String,
        body: String,
        amount: Double,
        bank: String,
        utga: String
    ) {
        try {
            // Deterministic docId to prevent duplicates (native receiver + App.tsx)
            val bodyHash = body.take(50).replace(Regex("[^a-zA-Z0-9]"), "").take(20)
            val timeKey = System.currentTimeMillis() / 60000  // round to nearest minute
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
                put("timestamp", JSONObject().put("integerValue", System.currentTimeMillis().toString()))
                put("status", JSONObject().put("stringValue", "pending"))
                put("source", JSONObject().put("stringValue", "native_receiver"))
                put("createdAt", JSONObject().put("timestampValue", isoDate))
            }

            val doc = JSONObject().put("fields", fields)

            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "PATCH"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            connection.connectTimeout = 15000
            connection.readTimeout = 15000

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(doc.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode in 200..299) {
                Log.i(TAG, "✅ SMS forwarded to Firestore: amount=$amount, bank=$bank")
            } else {
                val errorStream = connection.errorStream?.bufferedReader()?.readText() ?: "no error body"
                Log.e(TAG, "❌ Firestore error: $responseCode — $errorStream")
            }
            connection.disconnect()
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to send to Firestore: ${e.message}", e)
        }
    }
}
