import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Alert,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import SmsAndroid from 'react-native-get-sms-android';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

// Firestore REST API base URL for direct document creation
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/liscord-2b529/databases/(default)/documents';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Default Mongolian bank SMS senders
const DEFAULT_BANK_SENDERS = [
  '1900', '19001917', '19001918',  // Khan Bank
  '1800', '18001800',              // Golomt Bank
  '1500', '15001500',              // TDB
  '1234',                          // State Bank
  '7575',                          // XacBank
  '2525',                          // Bogd Bank
  'KhanBank', 'Golomt', 'TDB', 'XacBank', 'StateBank',
];

// Income keywords in Mongolian bank SMS
const INCOME_KEYWORDS = ['orlogo', 'Orlogo', 'ORLOGO', 'орлого', 'Орлого', 'орсон', 'credited', 'received'];

const backgroundTaskOptions = {
  taskName: 'LiscordBridge',
  taskTitle: 'Liscord SMS Bridge',
  taskDesc: 'Банкны гүйлгээний мессеж хүлээж байна...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#6366f1',
  linkingURI: 'liscordbridge://home',
  parameters: {
    delay: 10000,
  },
};

interface AppSettings {
  bankSenders: string[];
  onlyIncome: boolean;
  customKeywords: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  bankSenders: DEFAULT_BANK_SENDERS,
  onlyIncome: true,
  customKeywords: [],
};

// Parse amount from SMS body
function parseAmount(body: string): number {
  // Match patterns like "50,000.00", "125000", "50 000"
  const patterns = [
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)/i,
    /(?:орлого|orlogo|credited|дүн|amount)[:\s]*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)/i,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:орлого|orlogo)/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/[,\s]/g, ''));
    }
  }
  // Fallback: find largest number in SMS
  const numbers = body.match(/\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?/g);
  if (numbers) {
    const parsed = numbers.map(n => parseFloat(n.replace(/[,\s]/g, '')));
    return Math.max(...parsed.filter(n => n > 100)); // Filter out tiny numbers
  }
  return 0;
}

// Parse bank name from sender
function parseBankName(sender: string): string {
  if (sender.includes('1900') || sender.toLowerCase().includes('khan')) return 'Khan Bank';
  if (sender.includes('1800') || sender.toLowerCase().includes('golomt')) return 'Golomt';
  if (sender.includes('1500') || sender.toLowerCase().includes('tdb')) return 'TDB';
  if (sender.includes('7575') || sender.toLowerCase().includes('xac')) return 'XacBank';
  if (sender.includes('1234') || sender.toLowerCase().includes('state')) return 'Төрийн Банк';
  if (sender.includes('2525') || sender.toLowerCase().includes('bogd')) return 'Bogd Bank';
  return sender;
}

// Send SMS data to Firestore REST API
async function sendToFirestore(pairingKey: string, smsData: {
  sender: string;
  body: string;
  timestamp: number;
  amount: number;
  bank: string;
}): Promise<boolean> {
  try {
    // Write to sms_inbox collection using the pairing key as a pseudo-auth
    const docId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const url = `${FIRESTORE_BASE}/sms_inbox/${docId}`;

    const firestoreDoc = {
      fields: {
        pairingKey: { stringValue: pairingKey },
        sender: { stringValue: smsData.sender },
        body: { stringValue: smsData.body },
        bank: { stringValue: smsData.bank },
        amount: { doubleValue: smsData.amount },
        timestamp: { integerValue: String(smsData.timestamp) },
        status: { stringValue: 'pending' },
        createdAt: { timestampValue: new Date().toISOString() },
      }
    };

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreDoc),
    });

    return response.ok;
  } catch (error) {
    console.error('Firestore write failed:', error);
    return false;
  }
}

const App = () => {
  const [pairingKey, setPairingKey] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [newSender, setNewSender] = useState('');
  const [forwardCount, setForwardCount] = useState(0);

  // Use refs for background task to avoid stale closures
  const pairingKeyRef = useRef<string | null>(null);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  const forwardCountRef = useRef(0);
  const logsRef = useRef<string[]>([]);

  const device = useCameraDevice('back');

  useEffect(() => {
    checkPermissions();
    loadPairingKey();
    loadSettings();
    loadForwardCount();
  }, []);

  // Keep refs in sync
  useEffect(() => { pairingKeyRef.current = pairingKey; }, [pairingKey]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { forwardCountRef.current = forwardCount; }, [forwardCount]);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
    const entry = `[${timestamp}] ${msg}`;
    setLogs(prev => [entry, ...prev].slice(0, 30));
  }, []);

  const checkPermissions = async () => {
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      ]);
      const allGranted = Object.values(results).every(r => r === 'granted');
      if (!allGranted) {
        addLog('⚠️ Зөвшөөрөл бүрэн олгогдоогүй');
      } else {
        addLog('✅ Бүх зөвшөөрөл олгогдлоо');
      }
    } catch (err) {
      console.warn(err);
      addLog('❌ Зөвшөөрөл авахад алдаа');
    }
  };

  const loadPairingKey = async () => {
    const key = await AsyncStorage.getItem('LiscordPairingKey');
    if (key) {
      setPairingKey(key);
      pairingKeyRef.current = key;
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('LiscordSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        settingsRef.current = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    await AsyncStorage.setItem('LiscordSettings', JSON.stringify(newSettings));
  };

  const loadForwardCount = async () => {
    const count = await AsyncStorage.getItem('LiscordForwardCount');
    if (count) {
      const n = parseInt(count, 10);
      setForwardCount(n);
      forwardCountRef.current = n;
    }
  };

  const startScanning = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    if (cameraPermission === 'granted') {
      setIsScanning(true);
    } else {
      Alert.alert("Анхааруулга", "Камер ашиглах эрх шаардлагатай");
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        const scanned = codes[0].value;
        let finalKey = '';

        if (scanned.startsWith('ls_sk_')) {
          finalKey = scanned;
        } else if (scanned.includes('key=ls_sk_')) {
          const parts = scanned.split('key=');
          if (parts.length > 1) {
            finalKey = parts[1].split('&')[0];
          }
        }

        if (finalKey.startsWith('ls_sk_')) {
          setIsScanning(false);
          AsyncStorage.setItem('LiscordPairingKey', finalKey);
          setPairingKey(finalKey);
          pairingKeyRef.current = finalKey;
          addLog('✅ QR холболт амжилттай');
          Alert.alert("Амжилттай", "Холболт амжилттай үүслээ!");
        }
      }
    }
  });

  const unpair = async () => {
    await AsyncStorage.removeItem('LiscordPairingKey');
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
    setPairingKey(null);
    pairingKeyRef.current = null;
    setIsRunning(false);
    setForwardCount(0);
    forwardCountRef.current = 0;
    await AsyncStorage.setItem('LiscordForwardCount', '0');
    addLog('🔓 Салгалт хийгдлээ');
  };

  // Check if SMS is from a known bank sender
  const isBankSms = (sender: string, currentSettings: AppSettings): boolean => {
    return currentSettings.bankSenders.some(bankNum =>
      sender.includes(bankNum) || bankNum.includes(sender)
    );
  };

  // Check if SMS contains income keywords
  const isIncomeSms = (body: string, currentSettings: AppSettings): boolean => {
    const allKeywords = [...INCOME_KEYWORDS, ...currentSettings.customKeywords];
    return allKeywords.some(keyword => body.toLowerCase().includes(keyword.toLowerCase()));
  };

  // Background task that polls SMS inbox
  const backgroundTask = async (taskDataArguments: any) => {
    let lastCheckedStamp = Date.now();
    const { delay } = taskDataArguments;

    // Log to AsyncStorage for persistence (UI updates won't work in background)
    const bgLog = async (msg: string) => {
      try {
        const existing = await AsyncStorage.getItem('LiscordBgLogs');
        const arr = existing ? JSON.parse(existing) : [];
        const timestamp = new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        arr.unshift(`[${timestamp}] ${msg}`);
        await AsyncStorage.setItem('LiscordBgLogs', JSON.stringify(arr.slice(0, 30)));
      } catch (_e) { /* ignore */ }
    };

    await bgLog('🚀 Background task эхэллээ');

    while (BackgroundService.isRunning()) {
      const currentKey = pairingKeyRef.current;
      const currentSettings = settingsRef.current;

      if (!currentKey) {
        await sleep(delay);
        continue;
      }

      try {
        const filter = {
          box: 'inbox',
          minDate: lastCheckedStamp,
        };

        await new Promise<void>((resolve) => {
          SmsAndroid.list(
            JSON.stringify(filter),
            (fail: string) => {
              bgLog(`❌ SMS уншихад алдаа: ${fail}`);
              resolve();
            },
            async (count: number, smsList: string) => {
              if (count > 0) {
                try {
                  const arr = JSON.parse(smsList);
                  let forwarded = 0;

                  for (const msg of arr) {
                    const sender = msg.address || '';
                    const body = msg.body || '';

                    // Filter: only bank senders
                    if (!isBankSms(sender, currentSettings)) continue;

                    // Filter: only income if setting is on
                    if (currentSettings.onlyIncome && !isIncomeSms(body, currentSettings)) continue;

                    // Parse amount and bank
                    const amount = parseAmount(body);
                    const bank = parseBankName(sender);

                    // Send to Firestore
                    const success = await sendToFirestore(currentKey, {
                      sender,
                      body,
                      timestamp: msg.date || Date.now(),
                      amount,
                      bank,
                    });

                    if (success) {
                      forwarded++;
                      // Update persistent counter
                      const countStr = await AsyncStorage.getItem('LiscordForwardCount');
                      const newCount = (parseInt(countStr || '0', 10)) + 1;
                      await AsyncStorage.setItem('LiscordForwardCount', String(newCount));
                    }
                  }

                  if (forwarded > 0) {
                    await bgLog(`📤 ${forwarded} мессеж дамжууллаа`);
                  }
                } catch (parseErr: any) {
                  await bgLog(`❌ SMS parse алдаа: ${parseErr?.message || parseErr}`);
                }
              }
              resolve();
            },
          );
        });
      } catch (e: any) {
        await bgLog(`❌ Polling алдаа: ${e?.message || e}`);
      }

      lastCheckedStamp = Date.now();
      await sleep(delay);
    }
  };

  const toggleService = async () => {
    if (!pairingKey) {
      Alert.alert("Холбогдоогүй", "Эхлээд QR код уншуулж холбогдоно уу");
      return;
    }

    if (isRunning) {
      try {
        await BackgroundService.stop();
        setIsRunning(false);
        addLog('⏹ Дамжуулалт зогслоо');
      } catch (e: any) {
        addLog(`❌ Зогсооход алдаа: ${e?.message}`);
      }
    } else {
      try {
        // Test SMS read permission first
        await new Promise<void>((resolve, reject) => {
          SmsAndroid.list(
            JSON.stringify({ box: 'inbox', maxCount: 1 }),
            (fail: string) => reject(new Error(`SMS зөвшөөрөл: ${fail}`)),
            (_count: number, _smsList: string) => resolve(),
          );
        });

        addLog('✅ SMS унших зөвшөөрөл ажиллаж байна');

        await BackgroundService.start(backgroundTask, backgroundTaskOptions);
        setIsRunning(true);
        addLog('▶ Дамжуулалт эхэллээ');
      } catch (e: any) {
        console.error('Background service error:', e);
        addLog(`❌ Алдаа: ${e?.message || 'Тодорхойгүй'}`);
        Alert.alert("Алдаа", `${e?.message || 'Тодорхойгүй алдаа'}\n\nSMS унших зөвшөөрөл олгосон эсэхээ шалгана уу.`);
      }
    }
  };

  // Refresh visible state from AsyncStorage (for background task updates)
  const refreshFromStorage = useCallback(async () => {
    const count = await AsyncStorage.getItem('LiscordForwardCount');
    if (count) {
      setForwardCount(parseInt(count, 10));
    }
    const bgLogs = await AsyncStorage.getItem('LiscordBgLogs');
    if (bgLogs) {
      try {
        const parsed = JSON.parse(bgLogs);
        setLogs(prev => {
          // Merge bg logs with UI logs, deduplicate
          const combined = [...parsed, ...prev];
          const unique = [...new Set(combined)];
          return unique.slice(0, 30);
        });
      } catch (_e) { /* ignore */ }
    }
  }, []);

  // Periodically refresh UI from storage when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(refreshFromStorage, 5000);
    return () => clearInterval(interval);
  }, [isRunning, refreshFromStorage]);

  const addBankSender = () => {
    if (!newSender.trim()) return;
    const updated = { ...settings, bankSenders: [...settings.bankSenders, newSender.trim()] };
    saveSettings(updated);
    setNewSender('');
  };

  const removeBankSender = (sender: string) => {
    const updated = { ...settings, bankSenders: settings.bankSenders.filter(s => s !== sender) };
    saveSettings(updated);
  };

  // ---- SCANNER VIEW ----
  if (isScanning && device) {
    return (
      <SafeAreaView style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerHint}>QR кодыг камерт харуулна уу</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScanning(false)}>
          <Text style={styles.closeBtnText}>БОЛИХ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---- SETTINGS VIEW ----
  if (showSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Тохиргоо</Text>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Text style={styles.backBtn}>← Буцах</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Income Only Toggle */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Зөвхөн орлого</Text>
                <Text style={styles.settingDesc}>Зөвхөн орлогын мессежийг дамжуулна</Text>
              </View>
              <Switch
                value={settings.onlyIncome}
                onValueChange={(val) => saveSettings({ ...settings, onlyIncome: val })}
                trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                thumbColor={settings.onlyIncome ? '#6366f1' : '#9ca3af'}
              />
            </View>
          </View>

          {/* Bank Senders */}
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Банкны дугаарууд</Text>
            <Text style={styles.settingDesc}>Эдгээр дугааруудаас ирсэн SMS-ийг л дамжуулна</Text>

            <View style={styles.senderInputRow}>
              <TextInput
                style={styles.senderInput}
                placeholder="Дугаар нэмэх... (1900, Golomt гм)"
                value={newSender}
                onChangeText={setNewSender}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addBankSender}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sendersList}>
              {settings.bankSenders.map((sender, i) => (
                <TouchableOpacity
                  key={`${sender}-${i}`}
                  style={styles.senderChip}
                  onLongPress={() => {
                    Alert.alert('Устгах уу?', `"${sender}" дугаарыг жагсаалтаас хасах уу?`, [
                      { text: 'Үгүй', style: 'cancel' },
                      { text: 'Тийм', onPress: () => removeBankSender(sender), style: 'destructive' },
                    ]);
                  }}
                >
                  <Text style={styles.senderChipText}>{sender}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hintText}>Устгахдаа удаан дарна уу</Text>
          </View>

          {/* Reset */}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              Alert.alert('Анхны тохиргоо', 'Бүх тохиргоог анхны утгад нь буцаах уу?', [
                { text: 'Үгүй', style: 'cancel' },
                { text: 'Тийм', onPress: () => saveSettings(DEFAULT_SETTINGS) },
              ]);
            }}
          >
            <Text style={styles.resetBtnText}>🔄 Анхны тохиргоонд буцаах</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- MAIN VIEW ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Liscord Bridge</Text>
        <Text style={styles.subtitle}>SMS Forwarder</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Card */}
        <View style={[styles.statusCard, pairingKey ? styles.statusCardActive : styles.statusCardInactive]}>
          <Text style={styles.statusLabel}>Төлөв</Text>
          <Text style={styles.statusValue}>
            {pairingKey ? (isRunning ? 'Идэвхтэй 🟢' : 'Холбогдсон 🔗') : 'Холбогдоогүй ❌'}
          </Text>
          {pairingKey && (
            <Text style={styles.keyText} numberOfLines={1}>Түлхүүр: {pairingKey}</Text>
          )}
          {pairingKey && (
            <Text style={styles.statText}>Дамжуулсан: {forwardCount} мессеж</Text>
          )}
        </View>

        {!pairingKey ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
            <Text style={styles.primaryBtnText}>📷 Системтэй холбох (QR Scan)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsBox}>
            <TouchableOpacity
              style={[styles.actionBtn, isRunning ? styles.actionBtnStop : styles.actionBtnStart]}
              onPress={toggleService}
            >
              <Text style={styles.actionBtnText}>
                {isRunning ? '⏹ Дамжуулалтыг ЗОГСООХ' : '▶ Дамжуулалтыг ЭХЛҮҮЛЭХ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
              <Text style={styles.settingsBtnText}>⚙️ Тохиргоо</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={unpair}>
              <Text style={styles.secondaryBtnText}>🔓 Салгах</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Activity Log */}
        {logs.length > 0 && (
          <View style={styles.logsCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.logsTitle}>📋 Үйл ажиллагааны лог</Text>
              {isRunning && (
                <TouchableOpacity onPress={refreshFromStorage}>
                  <Text style={{ color: '#6366f1', fontSize: 13, fontWeight: '600' }}>🔄 Шинэчлэх</Text>
                </TouchableOpacity>
              )}
            </View>
            {logs.map((log, i) => (
              <Text key={i} style={styles.logEntry}>{log}</Text>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Тухай</Text>
          <Text style={styles.infoText}>
            Энэ апп нь таны утсанд ирсэн банкны SMS мессежийг автоматаар Liscord систем рүү дамжуулна.
          </Text>
          <Text style={styles.infoText}>
            ⚙️ Тохиргоо хэсэгт банкны дугаар нэмэх/хасах, зөвхөн орлого шүүх тохиргоо өөрчлөх боломжтой.
          </Text>
          <Text style={styles.infoText}>
            ⚠️ "Дамжуулалтыг ЭХЛҮҮЛЭХ" дарсны дараа утсаа хааж болно — арын горимд автоматаар ажиллана.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  backBtn: { fontSize: 16, color: '#6366f1', fontWeight: '600', marginTop: 8 },
  content: { flex: 1, padding: 20 },

  // Status
  statusCard: { padding: 20, borderRadius: 16, marginBottom: 24 },
  statusCardInactive: { backgroundColor: '#fee2e2' },
  statusCardActive: { backgroundColor: '#dcfce7' },
  statusLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 },
  statusValue: { fontSize: 20, fontWeight: '700', marginTop: 8, color: '#1a1a1a' },
  keyText: { fontSize: 11, color: '#666', marginTop: 12, opacity: 0.7 },
  statText: { fontSize: 13, color: '#166534', marginTop: 6, fontWeight: '600' },

  // Buttons
  primaryBtn: { backgroundColor: '#6366f1', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  actionsBox: { gap: 12, marginBottom: 24 },
  actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center' },
  actionBtnStart: { backgroundColor: '#10b981' },
  actionBtnStop: { backgroundColor: '#ef4444' },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  settingsBtn: { padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' },
  settingsBtnText: { color: '#4338ca', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  secondaryBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },

  // Scanner
  closeBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  scannerOverlay: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  scannerHint: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Settings
  settingCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  settingDesc: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  senderInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  senderInput: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1a1a1a' },
  addBtn: { backgroundColor: '#6366f1', width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  sendersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  senderChip: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#c7d2fe' },
  senderChipText: { color: '#4338ca', fontSize: 13, fontWeight: '600' },
  hintText: { fontSize: 11, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' },
  resetBtn: { padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  resetBtnText: { color: '#c2410c', fontSize: 15, fontWeight: '600' },

  // Logs
  logsCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f0f0f0' },
  logsTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  logEntry: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontFamily: 'monospace' },

  // Info
  infoCard: { backgroundColor: '#f0f9ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bae6fd' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0c4a6e', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#0369a1', marginBottom: 6, lineHeight: 20 },
});

export default App;
