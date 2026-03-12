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
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import SmsAndroid from 'react-native-get-sms-android';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

// Firestore REST API base URL for direct document creation
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/liscord-2b529/databases/(default)/documents';
const APP_VERSION = '1.2';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Default Mongolian bank SMS senders
// Empty by default — user adds their bank's actual SMS sender numbers
const DEFAULT_BANK_SENDERS: string[] = [];

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
  // Keep service running when app is closed
  android: {
    notification: {
      channelName: 'SMS Bridge',
      channelDescription: 'Банкны SMS мониторинг',
    },
  },
  parameters: {
    delay: 8000,
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

// ======= MODULE-LEVEL REFS (accessible from headless JS task) =======
let _pairingKey: string | null = null;
let _settings: AppSettings = DEFAULT_SETTINGS;
let _forwardCount = 0;

// Parse amount from SMS body
function parseAmount(body: string): number {
  // Pattern 1: ORLOGO: 1975000.00MNT or ORLOGO: 50,000.00 MNT
  const patterns = [
    /(?:orlogo|орлого)[:\s]*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)/i,
    /(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)/i,
    /(?:орлого|orlogo|credited|дүн|amount)[:\s]*(\d[\d,\s]*(?:\.\d{1,2})?)/i,
    /(\d[\d,]*(?:\.\d{1,2})?)\s*(?:орлого|orlogo)/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/[,\s]/g, ''));
      if (val > 0) return val;
    }
  }
  // Fallback: find largest number in SMS (> 100)
  const numbers = body.match(/\d[\d,]*(?:\.\d{1,2})?/g);
  if (numbers) {
    const parsed = numbers.map(n => parseFloat(n.replace(/[,\s]/g, '')));
    return Math.max(...parsed.filter(n => n > 100));
  }
  return 0;
}

// Parse bank name from sender
function parseBankName(sender: string, body?: string): string {
  // Check sender first
  if (sender.includes('1900') || sender.toLowerCase().includes('khan')) return 'Khan Bank';
  if (sender.includes('1800') || sender.toLowerCase().includes('golomt')) return 'Golomt';
  if (sender.includes('1500') || sender.toLowerCase().includes('tdb')) return 'TDB';
  if (sender.includes('7575') || sender.toLowerCase().includes('xac')) return 'XacBank';
  if (sender.includes('1234') || sender.toLowerCase().includes('state')) return 'Төрийн Банк';
  if (sender.includes('2525') || sender.toLowerCase().includes('bogd')) return 'Bogd Bank';
  // Check SMS body for bank identifiers
  if (body) {
    const lower = body.toLowerCase();
    if (lower.includes('khan') || lower.includes('хаан')) return 'Khan Bank';
    if (lower.includes('golomt') || lower.includes('голомт')) return 'Golomt';
    if (lower.includes('tdb') || lower.includes('худалдаа')) return 'TDB';
    if (lower.includes('xac') || lower.includes('хас')) return 'XacBank';
    if (lower.includes('state') || lower.includes('төрийн')) return 'Төрийн Банк';
    if (lower.includes('bogd') || lower.includes('богд')) return 'Bogd Bank';
    // If body has ORLOGO pattern, it's a bank SMS — use sender as label
    if (/orlogo|орлого/i.test(body)) return `Банк (${sender})`;
  }
  return sender;
}

// Parse transaction note/utga from SMS body
function parseUtga(body: string): string {
  const patterns = [
    /(?:guilgeenii\s*)?utga[:\s]*([^\n,.]+)/i,
    /(?:гүйлгээний\s*)?утга[:\s]*([^\n,.]+)/i,
    /note[:\s]*([^\n,.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

// ======= MODULE-LEVEL HELPERS (accessible from background task) =======
function isBankSms(sender: string, body: string, currentSettings: AppSettings): boolean {
  // Check sender match
  const senderMatch = currentSettings.bankSenders.some(bankNum =>
    sender.includes(bankNum) || bankNum.includes(sender)
  );
  if (senderMatch) return true;
  // Content-based detection: if body contains income keywords, treat as bank SMS
  const hasIncomeKeyword = /orlogo|орлого|credited|received/i.test(body);
  const hasAmount = /\d+\.?\d*\s*MNT/i.test(body);
  return hasIncomeKeyword && hasAmount;
}

function isIncomeSms(body: string, currentSettings: AppSettings): boolean {
  const allKeywords = [...INCOME_KEYWORDS, ...currentSettings.customKeywords];
  return allKeywords.some(keyword => body.toLowerCase().includes(keyword.toLowerCase()));
}

// ======= BACKGROUND TASK (module-level, no closure dependency) =======
const backgroundTask = async (taskDataArguments: any) => {
  let lastCheckedStamp = Date.now();
  const { delay } = taskDataArguments;
  let totalForwarded = 0;
  let cycleCount = 0;

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

  // Use an infinite loop with manual running check
  const keepRunning = async () => {
    while (BackgroundService.isRunning()) {
      cycleCount++;
      const currentKey = _pairingKey;
      const currentSettings = _settings;

      // Update notification every cycle to keep service alive on Samsung/Android 14+
      try {
        await BackgroundService.updateNotification({
          taskDesc: totalForwarded > 0
            ? `📤 ${totalForwarded} мессеж дамжууллаа | Хүлээж байна...`
            : 'Банкны гүйлгээний мессеж хүлээж байна...',
        });
      } catch (_e) { /* ignore notification update errors */ }

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

                    if (!isBankSms(sender, body, currentSettings)) continue;
                    if (currentSettings.onlyIncome && !isIncomeSms(body, currentSettings)) continue;

                    const amount = parseAmount(body);
                    const bank = parseBankName(sender, body);
                    const utga = parseUtga(body);

                    const success = await sendToFirestore(currentKey, {
                      sender,
                      body,
                      timestamp: msg.date || Date.now(),
                      amount,
                      bank,
                      utga,
                    });

                    if (success) {
                      forwarded++;
                      totalForwarded++;
                      const countStr = await AsyncStorage.getItem('LiscordForwardCount');
                      const newCount = (parseInt(countStr || '0', 10)) + 1;
                      _forwardCount = newCount;
                      await AsyncStorage.setItem('LiscordForwardCount', String(newCount));
                    }
                  }

                  if (forwarded > 0) {
                    await bgLog(`📤 ${forwarded} мессеж дамжууллаа`);
                    // Update notification immediately after forwarding
                    try {
                      await BackgroundService.updateNotification({
                        taskDesc: `📤 ${totalForwarded} мессеж дамжууллаа | Хүлээж байна...`,
                      });
                    } catch (_ne) { /* ignore */ }
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

  // Start polling and never let the promise resolve (keeps service alive)
  await keepRunning();
};

// Send SMS data to Firestore REST API
async function sendToFirestore(pairingKey: string, smsData: {
  sender: string;
  body: string;
  timestamp: number;
  amount: number;
  bank: string;
  utga: string;
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
        utga: { stringValue: smsData.utga },
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
    // Auto-start: if pairing key exists but background service isn't running, start it
    const autoStartService = async () => {
      try {
        const running = BackgroundService.isRunning();
        if (running) {
          setIsRunning(true);
          addLog('🔄 Дамжуулалт ажиллаж байна (сэргээгдлээ)');
        } else {
          // Check if we have a pairing key — if so, auto-start
          const key = await AsyncStorage.getItem('LiscordPairingKey');
          if (key) {
            addLog('🚀 Автомат эхлүүлж байна...');
            await BackgroundService.start(backgroundTask, backgroundTaskOptions);
            setIsRunning(true);
            addLog('✅ Дамжуулалт автоматаар эхэллээ');
          }
        }
      } catch (_e) { /* ignore */ }
    };
    autoStartService();
  }, []);

  // Keep refs AND module-level vars in sync
  useEffect(() => { pairingKeyRef.current = pairingKey; _pairingKey = pairingKey; }, [pairingKey]);
  useEffect(() => { settingsRef.current = settings; _settings = settings; }, [settings]);
  useEffect(() => { forwardCountRef.current = forwardCount; _forwardCount = forwardCount; }, [forwardCount]);
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
      _pairingKey = key;
      // Sync to native SharedPreferences for BroadcastReceiver
      try { NativeModules.PairingKeyModule?.setPairingKey(key); } catch (_e) { }
    }
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('LiscordSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        settingsRef.current = merged;
        _settings = merged;
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    settingsRef.current = newSettings;
    _settings = newSettings;
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
          // Sync to native SharedPreferences for BroadcastReceiver
          try { NativeModules.PairingKeyModule?.setPairingKey(finalKey); } catch (_e) { }
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
    // Clear native SharedPreferences
    try { NativeModules.PairingKeyModule?.clearPairingKey(); } catch (_e) { }
    setIsRunning(false);
    setForwardCount(0);
    forwardCountRef.current = 0;
    await AsyncStorage.setItem('LiscordForwardCount', '0');
    addLog('🔓 Салгалт хийгдлээ');
  };

  // ---- REMOVED: backgroundTask moved to module scope ----

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
        <StatusBar barStyle="light-content" backgroundColor="#0f0f14" />
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
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(99,102,241,0.4)' }}
                thumbColor={settings.onlyIncome ? '#6366f1' : '#4b5563'}
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
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addBankSender}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sendersList}>
              {settings.bankSenders.length === 0 && (
                <Text style={styles.hintText}>Банкнаас ирдэг SMS-ийн дугаарыг нэмнэ үү (жнь: 1900, Golomt)</Text>
              )}
              {settings.bankSenders.map((sender, i) => (
                <View key={`${sender}-${i}`} style={styles.senderChip}>
                  <Text style={styles.senderChipText}>{sender}</Text>
                  <TouchableOpacity
                    style={styles.senderDeleteBtn}
                    onPress={() => removeBankSender(sender)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.senderDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
      <StatusBar barStyle="light-content" backgroundColor="#0f0f14" />
      <View style={styles.header}>
        <Text style={styles.title}>Liscord Bridge</Text>
        <Text style={styles.subtitle}>SMS Forwarder v{APP_VERSION}</Text>
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
                  <Text style={{ color: '#818cf8', fontSize: 13, fontWeight: '600' }}>🔄 Шинэчлэх</Text>
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

        <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 8 }}>v{APP_VERSION} (build 2)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ===== BASE =====
  container: { flex: 1, backgroundColor: '#0f0f14' },
  header: {
    padding: 24, paddingTop: 48, alignItems: 'center',
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0f0f14',
  },
  title: { fontSize: 26, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  backBtn: { fontSize: 15, color: '#818cf8', fontWeight: '700', marginTop: 10 },
  content: { flex: 1, padding: 20 },

  // ===== STATUS CARD (glassmorphism) =====
  statusCard: {
    padding: 22, borderRadius: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statusCardInactive: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
  statusCardActive: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' },
  statusLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
    fontWeight: '800', letterSpacing: 2,
  },
  statusValue: { fontSize: 22, fontWeight: '800', marginTop: 8, color: '#ffffff' },
  keyText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 14, fontFamily: 'monospace' },
  statText: {
    fontSize: 14, color: '#34d399', marginTop: 8, fontWeight: '700',
  },

  // ===== BUTTONS =====
  primaryBtn: {
    backgroundColor: '#6366f1', padding: 18, borderRadius: 16,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  actionsBox: { gap: 12, marginBottom: 28 },
  actionBtn: {
    padding: 18, borderRadius: 16, alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  actionBtnStart: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
  },
  actionBtnStop: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionBtnText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  settingsBtn: {
    padding: 16, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  settingsBtnText: { color: '#a5b4fc', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    padding: 14, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  secondaryBtnText: { color: '#f87171', fontSize: 14, fontWeight: '700' },

  // ===== SCANNER =====
  closeBtn: {
    position: 'absolute', bottom: 50, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 36,
    paddingVertical: 16, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  closeBtnText: { color: 'white', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  scannerOverlay: {
    position: 'absolute', top: 60, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  scannerHint: { color: 'white', fontSize: 14, fontWeight: '700' },

  // ===== SETTINGS =====
  settingCard: {
    backgroundColor: '#1a1b23', borderRadius: 18, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  settingDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  senderInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  senderInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#ffffff',
  },
  addBtn: {
    backgroundColor: '#6366f1', width: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: 'white', fontSize: 22, fontWeight: '800' },
  sendersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  senderChip: {
    backgroundColor: 'rgba(99,102,241,0.12)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  senderChipText: { color: '#a5b4fc', fontSize: 12, fontWeight: '700' },
  senderDeleteBtn: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  senderDeleteText: { color: '#f87171', fontSize: 10, fontWeight: '900' },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, fontStyle: 'italic' },
  resetBtn: {
    padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.08)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
  },
  resetBtnText: { color: '#fb923c', fontSize: 14, fontWeight: '700' },

  // ===== LOGS =====
  logsCard: {
    backgroundColor: '#1a1b23', borderRadius: 18, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  logsTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  logEntry: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4, fontFamily: 'monospace' },

  // ===== INFO =====
  infoCard: {
    backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: '#93c5fd', marginBottom: 8 },
  infoText: { fontSize: 12, color: 'rgba(147,197,253,0.7)', marginBottom: 6, lineHeight: 19 },
});

export default App;
