package com.liscordbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
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
 * Reads pairing key from SharedPreferences (set by React Native AsyncStorage).
 * Makes Firestore REST API call directly in Kotlin — no JS engine needed.
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

        val bundle: Bundle = intent.extras ?: return
        val pdus = bundle.get("pdus") as? Array<*> ?: return
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

            val amount = parseAmount(body)
            val bank = parseBankName(sender, body)
            val utga = parseUtga(body)

            Log.d(TAG, "Forwarding: amount=$amount, bank=$bank, utga=$utga")

            // Send to Firestore on background thread (network not allowed on main thread)
            thread {
                sendToFirestore(pairingKey, sender, body, amount, bank, utga)
            }
        }
    }

    private fun isIncomeSms(body: String, keywords: List<String>): Boolean {
        val lower = body.lowercase()
        val hasKeyword = keywords.any { lower.contains(it.lowercase()) }
        val hasAmount = Regex("\\d[\\d,.]*").containsMatchIn(body)
        return hasKeyword && hasAmount
    }

    private fun parseAmount(body: String): Double {
        val patterns = listOf(
            Regex("(?:orlogo|орлого)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)", RegexOption.IGNORE_CASE),
            Regex("(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|төг)", RegexOption.IGNORE_CASE),
            Regex("(?:орлого|orlogo|credited|дүн|amount)[:\\s]*(\\d[\\d,\\s]*(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE),
        )
        for (pattern in patterns) {
            val match = pattern.find(body)
            if (match != null) {
                val value = match.groupValues[1].replace(Regex("[,\\s]"), "").toDoubleOrNull() ?: 0.0
                if (value > 0) return value
            }
        }
        // Fallback: find largest number > 100
        val numbers = Regex("\\d[\\d,]*(?:\\.\\d{1,2})?").findAll(body)
        return numbers.mapNotNull { it.value.replace(",", "").toDoubleOrNull() }
            .filter { it > 100 }
            .maxOrNull() ?: 0.0
    }

    private fun parseBankName(sender: String, body: String): String {
        // Check sender
        if (sender.contains("1900") || sender.lowercase().contains("khan")) return "Khan Bank"
        if (sender.contains("1800") || sender.contains("132525") || sender.lowercase().contains("golomt")) return "Golomt"
        if (sender.contains("1500") || sender.lowercase().contains("tdb")) return "TDB"
        if (sender.contains("7575") || sender.lowercase().contains("xac")) return "XacBank"
        if (sender.contains("1234") || sender.lowercase().contains("state")) return "Төрийн Банк"
        if (sender.contains("2525") || sender.lowercase().contains("bogd")) return "Bogd Bank"
        
        // Check body
        val lower = body.lowercase()
        if (lower.contains("khan") || lower.contains("хаан")) return "Khan Bank"
        if (lower.contains("golomt") || lower.contains("голомт")) return "Golomt"
        if (lower.contains("tdb") || lower.contains("худалдаа")) return "TDB"
        if (lower.contains("xac") || lower.contains("хас")) return "XacBank"
        if (lower.contains("state") || lower.contains("төрийн")) return "Төрийн Банк"
        if (lower.contains("bogd") || lower.contains("богд")) return "Bogd Bank"
        
        if (Regex("orlogo|орлого", RegexOption.IGNORE_CASE).containsMatchIn(body)) {
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
            val docId = "sms_${System.currentTimeMillis()}_${(Math.random() * 100000).toInt()}"
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
                Log.e(TAG, "❌ Firestore error: $responseCode")
            }
            connection.disconnect()
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to send to Firestore: ${e.message}", e)
        }
    }
}
