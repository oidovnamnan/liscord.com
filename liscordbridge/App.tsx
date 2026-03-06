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
import axios from 'axios';

// Firebase Cloud Function endpoint for SMS forwarding
const CALLBACK_URL = 'https://us-central1-liscord-2b529.cloudfunctions.net/api/sms/callback';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

// Default Mongolian bank SMS senders
const DEFAULT_BANK_SENDERS = [
  '1900', '19001917', '19001918',  // Khan Bank
  '1800', '18001800',              // Golomt Bank
  '1500', '15001500',              // TDB (Trade and Development Bank)
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

  const device = useCameraDevice('back');

  useEffect(() => {
    checkPermissions();
    loadPairingKey();
    loadSettings();
    loadForwardCount();
  }, []);

  // Keep refs in sync
  useEffect(() => {
    pairingKeyRef.current = pairingKey;
  }, [pairingKey]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 20));
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
        Alert.alert("Зөвшөөрөл", "SMS унших болон камерын зөвшөөрөл шаардлагатай. Тохиргоо хэсгээс зөвшөөрнө үү.");
      }
    } catch (err) {
      console.warn(err);
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
    if (count) setForwardCount(parseInt(count, 10));
  };

  const incrementForwardCount = async () => {
    const newCount = forwardCount + 1;
    setForwardCount(newCount);
    await AsyncStorage.setItem('LiscordForwardCount', String(newCount));
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
    await AsyncStorage.setItem('LiscordForwardCount', '0');
  };

  // Check if SMS is from a known bank sender
  const isBankSms = (sender: string): boolean => {
    const currentSettings = settingsRef.current;
    return currentSettings.bankSenders.some(bankNum =>
      sender.includes(bankNum) || bankNum.includes(sender)
    );
  };

  // Check if SMS contains income keywords
  const isIncomeSms = (body: string): boolean => {
    const allKeywords = [...INCOME_KEYWORDS, ...settingsRef.current.customKeywords];
    return allKeywords.some(keyword => body.toLowerCase().includes(keyword.toLowerCase()));
  };

  // Background task that polls SMS inbox
  const backgroundTask = async (taskDataArguments: any) => {
    let lastCheckedStamp = Date.now();
    const { delay } = taskDataArguments;

    await new Promise<void>(async (resolve) => {
      while (BackgroundService.isRunning()) {
        const currentKey = pairingKeyRef.current;
        if (!currentKey) {
          await sleep(delay);
          continue;
        }

        const filter = {
          box: 'inbox',
          minDate: lastCheckedStamp,
        };

        try {
          SmsAndroid.list(
            JSON.stringify(filter),
            (fail: any) => {
              console.log('SMS read failed: ' + fail);
            },
            (count: number, smsList: string) => {
              if (count === 0) return;
              const arr = JSON.parse(smsList);
              arr.forEach((msg: any) => {
                const sender = msg.address || '';
                const body = msg.body || '';

                // Filter: only bank senders
                if (!isBankSms(sender)) return;

                // Filter: only income if setting is on
                const currentSettings = settingsRef.current;
                if (currentSettings.onlyIncome && !isIncomeSms(body)) return;

                // Forward to server
                axios.post(CALLBACK_URL, {
                  sender: sender,
                  text: body,
                  timestamp: msg.date,
                }, {
                  headers: {
                    'Authorization': `Bearer ${currentKey}`,
                    'Content-Type': 'application/json',
                  },
                  timeout: 15000,
                }).then(() => {
                  incrementForwardCount();
                }).catch(err => {
                  console.error("Forward failed:", err?.message || err);
                });
              });
            },
          );
        } catch (e) {
          console.error('SMS polling error:', e);
        }

        lastCheckedStamp = Date.now();
        await sleep(delay);
      }
    });
  };

  const toggleService = async () => {
    if (!pairingKey) {
      Alert.alert("Холбогдоогүй", "Эхлээд QR код уншуулж холбогдоно уу");
      return;
    }

    if (isRunning) {
      await BackgroundService.stop();
      setIsRunning(false);
      addLog('Дамжуулалт зогслоо');
    } else {
      try {
        await BackgroundService.start(backgroundTask, backgroundTaskOptions);
        setIsRunning(true);
        addLog('Дамжуулалт эхэллээ');
      } catch (e: any) {
        console.error('Background service error:', e);
        Alert.alert("Алдаа", `Арын үйлчилгээ эхлүүлж чадсангүй: ${e?.message || 'Тодорхойгүй алдаа'}`);
      }
    }
  };

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
            <Text style={styles.logsTitle}>📋 Үйл ажиллагааны лог</Text>
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
            Зөвхөн тохируулсан банкны дугааруудаас ирсэн, орлогын мессежийг дамжуулдаг.
          </Text>
          <Text style={styles.infoText}>
            ⚙️ Тохиргоо хэсэгт банкны дугаар нэмэх/хасах, зөвхөн орлого шүүх тохиргоог өөрчлөх боломжтой.
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
  logsTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  logEntry: { fontSize: 12, color: '#6b7280', marginBottom: 4, fontFamily: 'monospace' },

  // Info
  infoCard: { backgroundColor: '#f0f9ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bae6fd' },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#0c4a6e', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#0369a1', marginBottom: 6, lineHeight: 20 },
});

export default App;
