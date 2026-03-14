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
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import SmsAndroid from 'react-native-get-sms-android';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

// Firestore REST API base URL for direct document creation
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/liscord-2b529/databases/(default)/documents';
const APP_VERSION = '2.0';
const GITHUB_RELEASE_API = 'https://api.github.com/repos/oidovnamnan/liscord.com/releases/tags/bridge-latest';
const APK_DOWNLOAD_URL = 'https://github.com/oidovnamnan/liscord.com/releases/download/bridge-latest/app-release.apk';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Default Mongolian bank SMS senders
// Empty by default — user adds their bank's actual SMS sender numbers
const DEFAULT_BANK_SENDERS: string[] = [];

// Bank SMS keywords — covers all known Mongolian bank formats
const INCOME_KEYWORDS = [
  'orlogo', 'Orlogo', 'ORLOGO', 'орлого', 'Орлого', 'орсон', 'credited', 'received',
  // Golomt-style
  'dungeer', 'дүнгээр', 'dansand', 'guilgee', 'гүйлгээ',
  // Generic bank words
  'hiigdlee', 'хийгдлээ', 'шилжүүлэг', 'орлогын',
];

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
  // Priority 1: Amount near 'guilgeenii dun' / 'гүйлгээний дүн' (transaction amount, not balance)
  const txnPatterns = [
    /(?:guilgeenii\s*dun|гүйлгээний\s*(?:дүн|дүнгээр))[:\s]*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)?/i,
    /(?:orlogo|орлого)[:\s]*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)?/i,
    /(?:dun|дүн)[:\s]*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)?/i,
  ];
  for (const pattern of txnPatterns) {
    const match = body.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/[,\s]/g, ''));
      if (val > 0) return val;
    }
  }
  // Priority 2: Any number followed by MNT/₮ (but NOT after 'uldegdel/үлдэгдэл')
  const amountMnt = body.match(/(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|төг)/i);
  if (amountMnt) {
    // Check if this number is for balance (skip it)
    const fullMatch = amountMnt[0];
    const idx = body.indexOf(fullMatch);
    const before = body.substring(Math.max(0, idx - 30), idx).toLowerCase();
    if (!before.includes('uldegdel') && !before.includes('үлдэгдэл') && !before.includes('balance')) {
      const val = parseFloat(amountMnt[1].replace(/[,\s]/g, ''));
      if (val > 0) return val;
    }
  }
  // Priority 3: Fallback — second largest number (not balance which is usually largest)
  const numbers = body.match(/\d[\d,]*(?:\.\d{1,2})?/g);
  if (numbers) {
    const parsed = numbers.map(n => parseFloat(n.replace(/[,\s]/g, ''))).filter(n => n > 100);
    parsed.sort((a, b) => b - a);
    // If multiple numbers > 100, the largest is likely balance — use second
    if (parsed.length >= 2) return parsed[1];
    if (parsed.length === 1) return parsed[0];
  }
  return 0;
}

// Parse bank name from sender
function parseBankName(sender: string, body?: string): string {
  // Check sender first — check LONGER numbers before shorter to avoid partial matches
  if (sender.includes('1900') || sender.includes('19001917') || sender.includes('19001918')) return 'Khan Bank';
  if (sender.includes('132525') || sender.includes('18001800')) return 'Golomt';  // 132525 BEFORE 2525!
  if (sender.includes('1800')) return 'Golomt';
  if (sender.includes('15001500') || sender.includes('1500')) return 'TDB';
  if (sender.includes('7575')) return 'XacBank';
  if (sender.includes('1234')) return 'Төрийн Банк';
  if (sender.includes('2525')) return 'Bogd Bank';  // After 132525 checked above
  // Check SMS body for bank identifiers
  if (body) {
    const lower = body.toLowerCase();
    if (lower.includes('khan') || lower.includes('хаан')) return 'Khan Bank';
    if (lower.includes('golomt') || lower.includes('голомт')) return 'Golomt';
    if (lower.includes('tdb') || lower.includes('худалдаа')) return 'TDB';
    if (lower.includes('xac') || lower.includes('хас')) return 'XacBank';
    if (lower.includes('state') || lower.includes('төрийн')) return 'Төрийн Банк';
    if (lower.includes('bogd') || lower.includes('богд')) return 'Bogd Bank';
    if (/orlogo|орлого|dungeer|guilgee/i.test(body)) return `Банк (${sender})`;
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
  // Content-based detection: if body contains bank keywords + any number
  const hasIncomeKeyword = INCOME_KEYWORDS.some(kw => body.toLowerCase().includes(kw.toLowerCase()));
  const hasAmount = /\d[\d,.]*/.test(body);
  return hasIncomeKeyword && hasAmount;
}

function isIncomeSms(body: string, currentSettings: AppSettings): boolean {
  const allKeywords = [...INCOME_KEYWORDS, ...currentSettings.customKeywords];
  return allKeywords.some(keyword => body.toLowerCase().includes(keyword.toLowerCase()));
}

// ======= BACKGROUND TASK (module-level, no closure dependency) =======
// NOTE: SMS forwarding is handled entirely by native BootForegroundService (5s polling).
// This RN task only keeps the React Native service alive and syncs UI counters.
const backgroundTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;

  const bgLog = async (msg: string) => {
    try {
      const existing = await AsyncStorage.getItem('LiscordBgLogs');
      const arr = existing ? JSON.parse(existing) : [];
      const timestamp = new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
      arr.unshift(`[${timestamp}] ${msg}`);
      await AsyncStorage.setItem('LiscordBgLogs', JSON.stringify(arr.slice(0, 30)));
    } catch (_e) { /* ignore */ }
  };

  await bgLog('🚀 Background task эхэллээ (native service SMS дамжуулна)');

  // Keep service alive — native BootForegroundService handles actual SMS forwarding
  while (BackgroundService.isRunning()) {
    const countStr = await AsyncStorage.getItem('LiscordForwardCount');
    const totalForwarded = parseInt(countStr || '0', 10);

    // Update notification to keep service alive on Samsung/Android 14+
    try {
      await BackgroundService.updateNotification({
        taskDesc: totalForwarded > 0
          ? `📤 ${totalForwarded} мессеж дамжууллаа | Хүлээж байна...`
          : 'SMS хяналт идэвхтэй ✅ (native service)',
      });
    } catch (_e) { /* ignore notification update errors */ }

    await sleep(delay);
  }
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
    // Use deterministic docId to prevent duplicates (native receiver + App.tsx)
    const bodyHash = smsData.body.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    const timeKey = Math.floor(smsData.timestamp / 60000); // round to nearest minute
    const docId = `sms_${smsData.sender}_${timeKey}_${bodyHash}`;
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
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

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
    checkForUpdate();
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
      try {
        NativeModules.PairingKeyModule?.setPairingKey(key);
        // Sync app version for native update checker
        NativeModules.PairingKeyModule?.setAppVersion?.(APP_VERSION);
      } catch (_e) { }
      // Sync SMS templates from Firestore
      syncSmsConfigFromFirestore(key);
    }
  };

  // Fetch SMS templates from Firestore and sync keywords/senders to native
  const syncSmsConfigFromFirestore = async (key: string) => {
    try {
      // 1. Find business by pairingKey
      const bizUrl = `${FIRESTORE_BASE}:runQuery`;
      const bizRes = await fetch(bizUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'businesses' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'smsBridgeKey' },
                op: 'EQUAL',
                value: { stringValue: key },
              },
            },
            limit: 1,
          },
        }),
      });
      const bizData = await bizRes.json();
      if (!bizData?.[0]?.document?.name) return;

      const bizPath = bizData[0].document.name;
      const bizId = bizPath.split('/').pop();

      // 2. Fetch all smsTemplates for this business
      const tmplUrl = `${FIRESTORE_BASE}/businesses/${bizId}/smsTemplates`;
      const tmplRes = await fetch(tmplUrl);
      const tmplData = await tmplRes.json();

      if (!tmplData?.documents?.length) return;

      // 3. Extract all keywords, sender numbers, and full template data
      const allKeywords: string[] = [];
      const allSenders: string[] = [];
      const allTemplates: any[] = [];

      for (const doc of tmplData.documents) {
        const fields = doc.fields;
        // Check isActive
        if (fields?.isActive?.booleanValue === false) continue;

        const tmplObj: any = {};

        // Keywords
        if (fields?.incomeKeywords?.arrayValue?.values) {
          const keywords: string[] = [];
          for (const v of fields.incomeKeywords.arrayValue.values) {
            if (v.stringValue) {
              allKeywords.push(v.stringValue);
              keywords.push(v.stringValue);
            }
          }
          tmplObj.incomeKeywords = keywords;
        }
        // Sender numbers
        if (fields?.senderNumbers?.arrayValue?.values) {
          for (const v of fields.senderNumbers.arrayValue.values) {
            if (v.stringValue) allSenders.push(v.stringValue);
          }
        }
        // Prefix/suffix markers
        tmplObj.amountPrefix = fields?.amountPrefix?.stringValue || '';
        tmplObj.amountSuffix = fields?.amountSuffix?.stringValue || '';
        tmplObj.utgaPrefix = fields?.utgaPrefix?.stringValue || '';
        tmplObj.utgaSuffix = fields?.utgaSuffix?.stringValue || '';
        tmplObj.bankName = fields?.bankName?.stringValue || '';

        allTemplates.push(tmplObj);
      }

      // 4. Sync to native SharedPreferences
      if (allKeywords.length > 0 || allSenders.length > 0) {
        const keywordsStr = [...new Set(allKeywords)].join(',');
        const sendersStr = [...new Set(allSenders)].join(',');
        try {
          NativeModules.PairingKeyModule?.setSmsConfig(keywordsStr, sendersStr);
        } catch (_e) { }
      }
      // 5. Sync full templates JSON for native prefix/suffix parsing
      if (allTemplates.length > 0) {
        try {
          NativeModules.PairingKeyModule?.setSmsTemplates(JSON.stringify(allTemplates));
        } catch (_e) { }
      }
      addLog(`🔄 ${allTemplates.length} загвар, ${allSenders.length} sender синк хийгдлээ`);
    } catch (err) {
      // Silent fail — fallback to hardcoded keywords
      console.log('SMS config sync failed:', err);
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

  // ---- UPDATE CHECK ----
  const checkForUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch(GITHUB_RELEASE_API, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
      if (!res.ok) {
        addLog('⚠️ Шинэчлэл шалгахад алдаа');
        return;
      }
      const data = await res.json();
      // Extract version from release body — look for "v1.6" style or commit info
      const releaseName = data?.name || '';
      const releaseBody = data?.body || '';
      // Check if the release has a newer APK by comparing published date
      const publishedAt = data?.published_at || '';
      
      // Simple version detection: look for "v" followed by digits in the release
      const versionMatch = releaseBody.match(/v(\d+\.\d+)/i) || releaseName.match(/v(\d+\.\d+)/i);
      const remoteVersion = versionMatch ? versionMatch[1] : null;
      
      // Also check if the commit SHA in the release is different from our build
      const commitMatch = releaseBody.match(/Commit:\s*([a-f0-9]+)/i);
      const remoteCommit = commitMatch ? commitMatch[1].substring(0, 7) : null;
      
      if (remoteVersion && remoteVersion !== APP_VERSION) {
        setUpdateAvailable(remoteVersion);
        addLog(`🚀 Шинэ хувилбар v${remoteVersion} бэлэн!`);
      } else if (publishedAt) {
        // Check by date — if release is newer than 5 minutes after our check
        setUpdateAvailable(null);
        addLog(`✅ Хамгийн сүүлийн хувилбар (v${APP_VERSION})`);
      } else {
        addLog(`✅ Хувилбар шинэчлэл байхгүй`);
      }
    } catch (err) {
      addLog('⚠️ Шинэчлэл шалгаж чадсангүй');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const downloadUpdate = async () => {
    try {
      addLog('📥 APK татаж байна...');
      await Linking.openURL(APK_DOWNLOAD_URL);
    } catch (err) {
      Alert.alert('Алдаа', 'Татах холбоос нээгдсэнгүй');
    }
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Status Card */}
        <View style={[styles.statusCard, pairingKey ? styles.statusCardActive : styles.statusCardInactive]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, pairingKey && isRunning ? styles.dotGreen : pairingKey ? styles.dotYellow : styles.dotRed]} />
            <Text style={styles.statusValue}>
              {pairingKey ? (isRunning ? 'Идэвхтэй' : 'Холбогдсон') : 'Холбогдоогүй'}
            </Text>
          </View>
          {pairingKey && (
            <Text style={styles.keyText} numberOfLines={1}>{pairingKey}</Text>
          )}
          {pairingKey && (
            <View style={styles.statRow}>
              <Text style={styles.statText}>📤 {forwardCount}</Text>
              <Text style={styles.statLabel}>дамжуулсан</Text>
            </View>
          )}
        </View>

        {!pairingKey ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
            <Text style={styles.primaryBtnText}>QR холбох</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsBox}>
            <TouchableOpacity
              style={[styles.actionBtn, isRunning ? styles.actionBtnStop : styles.actionBtnStart]}
              onPress={toggleService}
            >
              <Text style={styles.actionBtnText}>
                {isRunning ? '⏹  Зогсоох' : '▶  Эхлүүлэх'}
              </Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
                <Text style={styles.settingsBtnText}>⚙ Тохиргоо</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.unpairBtn} onPress={unpair}>
                <Text style={styles.unpairBtnText}>Салгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Update Banner */}
        {updateAvailable && (
          <TouchableOpacity style={styles.updateBanner} onPress={downloadUpdate}>
            <View>
              <Text style={styles.updateBannerText}>Шинэ хувилбар v{updateAvailable}</Text>
              <Text style={styles.updateBannerHint}>Дарж шинэчлэнэ үү</Text>
            </View>
            <Text style={styles.updateBannerAction}>↓</Text>
          </TouchableOpacity>
        )}

        {/* Activity Log */}
        {logs.length > 0 && (
          <View style={styles.logsCard}>
            <View style={styles.logsHeader}>
              <Text style={styles.logsTitle}>Лог</Text>
              <TouchableOpacity onPress={checkingUpdate ? undefined : checkForUpdate}>
                <Text style={styles.refreshText}>{checkingUpdate ? '...' : 'v' + APP_VERSION}</Text>
              </TouchableOpacity>
            </View>
            {logs.slice(0, 15).map((log, i) => (
              <Text key={i} style={styles.logEntry}>{log}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ===== BASE =====
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingHorizontal: 24, paddingTop: 52, paddingBottom: 16, alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  backBtn: { fontSize: 14, color: '#818cf8', fontWeight: '700', marginTop: 10 },
  content: { flex: 1, paddingHorizontal: 20 },

  // ===== STATUS CARD =====
  statusCard: {
    padding: 20, borderRadius: 16, marginBottom: 20,
    borderWidth: 1,
  },
  statusCardInactive: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' },
  statusCardActive: { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotGreen: { backgroundColor: '#34d399' },
  dotYellow: { backgroundColor: '#fbbf24' },
  dotRed: { backgroundColor: '#f87171' },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  keyText: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 12, fontFamily: 'monospace' },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  statText: { fontSize: 20, color: '#34d399', fontWeight: '800' },
  statLabel: { fontSize: 12, color: 'rgba(52,211,153,0.6)', fontWeight: '600' },

  // ===== BUTTONS =====
  primaryBtn: {
    backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 16,
  },
  primaryBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  actionsBox: { gap: 10, marginBottom: 20 },
  actionBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  actionBtnStart: { backgroundColor: '#6366f1' },
  actionBtnStop: { backgroundColor: '#dc2626' },
  actionBtnText: { color: 'white', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  btnRow: { flexDirection: 'row', gap: 10 },
  settingsBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  settingsBtnText: { color: '#a5b4fc', fontSize: 14, fontWeight: '600' },
  unpairBtn: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)',
  },
  unpairBtnText: { color: '#f87171', fontSize: 14, fontWeight: '600' },

  // ===== UPDATE =====
  updateBanner: {
    backgroundColor: '#059669', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  updateBannerText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  updateBannerHint: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  updateBannerAction: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // ===== SCANNER =====
  closeBtn: {
    position: 'absolute', bottom: 50, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 36,
    paddingVertical: 14, borderRadius: 30,
  },
  closeBtnText: { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  scannerOverlay: {
    position: 'absolute', top: 60, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 24,
  },
  scannerHint: { color: 'white', fontSize: 14, fontWeight: '700' },

  // ===== SETTINGS =====
  settingCard: {
    backgroundColor: '#111118', borderRadius: 14, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  settingDesc: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 },
  senderInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  senderInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: '#ffffff',
  },
  addBtn: {
    backgroundColor: '#6366f1', width: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: 'white', fontSize: 20, fontWeight: '800' },
  sendersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  senderChip: {
    backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  senderChipText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700' },
  senderDeleteBtn: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  senderDeleteText: { color: '#f87171', fontSize: 9, fontWeight: '900' },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6, fontStyle: 'italic' },
  resetBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.06)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.15)',
  },
  resetBtnText: { color: '#fb923c', fontSize: 13, fontWeight: '700' },

  // ===== LOGS =====
  logsCard: {
    backgroundColor: '#111118', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  logsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  logsTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  refreshText: { fontSize: 11, color: 'rgba(129,140,248,0.6)', fontWeight: '600' },
  logEntry: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3, fontFamily: 'monospace', lineHeight: 15 },

  // ===== INFO =====
  infoCard: {
    backgroundColor: 'rgba(59,130,246,0.04)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)',
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#93c5fd', marginBottom: 6 },
  infoText: { fontSize: 11, color: 'rgba(147,197,253,0.5)', marginBottom: 4, lineHeight: 17 },

  // Unused but may be referenced
  secondaryBtn: {
    padding: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  secondaryBtnText: { color: '#f87171', fontSize: 13, fontWeight: '700' },
  statusLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
    fontWeight: '800', letterSpacing: 2,
  },
  checkUpdateBtn: {
    alignItems: 'center', padding: 12, marginBottom: 12,
    borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.06)',
  },
  checkUpdateText: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
});

export default App;
