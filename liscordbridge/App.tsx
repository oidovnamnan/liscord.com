import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import SmsAndroid from 'react-native-get-sms-android';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import axios from 'axios';

// The URL of your deployed Firebase Cloud Function
const CALLBACK_URL = 'https://us-central1-liscord-2b529.cloudfunctions.net/api/sms/callback';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

const backgroundTaskOptions = {
  taskName: 'LiscordBridge',
  taskTitle: 'Liscord SMS Bridge',
  taskDesc: 'Банкны гүйлгээний мессеж хүлээж байна...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'liscordbridge://chat/jane',
  parameters: {
    delay: 10000,
  },
};

const App = () => {
  const [pairingKey, setPairingKey] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<number>(Date.now());
  const [logs, setLogs] = useState<string[]>([]);

  const device = useCameraDevice('back');

  useEffect(() => {
    checkPermissions();
    loadPairingKey();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10)); // Keep last 10
  };

  const checkPermissions = async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      ]);
    } catch (err) {
      console.warn(err);
    }
  };

  const loadPairingKey = async () => {
    const key = await AsyncStorage.getItem('LiscordPairingKey');
    if (key) setPairingKey(key);
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
          // Extract from URL: ...?key=ls_sk_abc123...
          const parts = scanned.split('key=');
          if (parts.length > 1) {
            finalKey = parts[1].split('&')[0];
          }
        }

        if (finalKey.startsWith('ls_sk_')) {
          setIsScanning(false);
          AsyncStorage.setItem('LiscordPairingKey', finalKey);
          setPairingKey(finalKey);
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
    setIsRunning(false);
  };

  // This background task polls the device's inbox every 10 seconds for new bank sms messages
  const backgroundTask = async (taskDataArguments: any) => {
    let lastCheckedStamp = Date.now();
    const { delay } = taskDataArguments;

    await new Promise(async (resolve) => {
      for (let i = 0; BackgroundService.isRunning(); i++) {

        // Get all SMS received since last update
        let filter = {
          box: 'inbox',
          minDate: lastCheckedStamp,
        };

        SmsAndroid.list(
          JSON.stringify(filter),
          (fail: any) => {
            console.log('Failed with this error: ' + fail);
          },
          (count: number, smsList: string) => {
            var arr = JSON.parse(smsList);
            arr.forEach((msg: any) => {
              // Optionally filter by bank number here (e.g., 131111, 131700)
              // Forward to server
              console.log("Forwarding message: ", msg.body);
              axios.post(CALLBACK_URL, {
                sender: msg.address,
                text: msg.body,
                timestamp: msg.date
              }, {
                headers: {
                  'Authorization': `Bearer ${pairingKey}`
                }
              }).catch(err => console.error("Forward failed", err));
            });
          },
        );

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
    } else {
      try {
        await BackgroundService.start(backgroundTask, backgroundTaskOptions);
        setIsRunning(true);
      } catch (e) {
        Alert.alert("Алдаа", "Арын албанд ажиллуулж чадсангүй");
      }
    }
  };

  if (isScanning && device) {
    return (
      <SafeAreaView style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScanning(false)}>
          <Text style={styles.closeBtnText}>БОЛИХ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Liscord Bridge</Text>
        <Text style={styles.subtitle}>SMS Forwarder</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.statusCard, pairingKey ? styles.statusCardActive : styles.statusCardInactive]}>
          <Text style={styles.statusLabel}>Төлөв</Text>
          <Text style={styles.statusValue}>
            {pairingKey ? 'Холбогдсон 🔗' : 'Холбогдоогүй ❌'}
          </Text>
          {pairingKey && (
            <Text style={styles.keyText} numberOfLines={1}>Түлхүүр: {pairingKey}</Text>
          )}
        </View>

        {!pairingKey ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={startScanning}>
            <Text style={styles.primaryBtnText}>Системтэй холбох (QR Scan)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionsBox}>
            <TouchableOpacity style={[styles.actionBtn, isRunning ? styles.actionBtnStop : styles.actionBtnStart]} onPress={toggleService}>
              <Text style={styles.actionBtnText}>{isRunning ? 'Дамжуулалтыг ЗОГСООХ' : ' Дамжуулалтыг ЭХЛҮҮЛЭХ'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={unpair}>
              <Text style={styles.secondaryBtnText}>Салгах</Text>
            </TouchableOpacity>

            <Text style={styles.logsHint}>{isRunning ? 'Арын албанд ажиллаж байна...' : 'Унтраалттай'}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 40, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  content: { flex: 1, padding: 24 },
  statusCard: { padding: 20, borderRadius: 16, marginBottom: 32 },
  statusCardInactive: { backgroundColor: '#fee2e2' },
  statusCardActive: { backgroundColor: '#dcfce7' },
  statusLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: 'bold' },
  statusValue: { fontSize: 20, fontWeight: '700', marginTop: 8, color: '#1a1a1a' },
  keyText: { fontSize: 12, color: '#666', marginTop: 12, opacity: 0.7 },
  primaryBtn: { backgroundColor: '#6366f1', padding: 18, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  actionsBox: { gap: 16 },
  actionBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  actionBtnStart: { backgroundColor: '#10b981' },
  actionBtnStop: { backgroundColor: '#ef4444' },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: '#4b5563', fontSize: 16, fontWeight: '600' },
  closeBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logsHint: { textAlign: 'center', marginTop: 20, color: '#888', fontStyle: 'italic' }
});

export default App;
