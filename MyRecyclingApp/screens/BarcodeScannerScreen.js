import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as Haptics from 'expo-haptics';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recyclableInfo, setRecyclableInfo] = useState(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const response = await axios.get(`${API_BASE_URL}/api/recyclables/${data}`);
      setRecyclableInfo(response.data); // expects { recyclable, material, message? }
    } catch (error) {
      setRecyclableInfo({
        recyclable: false,
        material: 'Unknown',
        message: 'Unable to check recyclability at the moment'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "aztec", "ean13", "ean8", "qr", "pdf417", "upc_e",
            "datamatrix", "code39", "code93", "itf14", "codabar",
            "code128", "upc_a"
          ],
        }}
      />

      <View style={styles.guideBox} />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Checking recyclability...</Text>
        </View>
      )}

      <Modal visible={!!recyclableInfo} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {recyclableInfo?.recyclable ? (
              <>
                <Text style={styles.modalTitle}>♻️ Recyclable!</Text>
                <Text style={styles.modalText}>
                  Material: {recyclableInfo.material || 'Unknown'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>🚫 Not Recyclable</Text>
                <Text style={styles.modalText}>
                  {recyclableInfo.message || 'Not marked as recyclable'}
                </Text>
                <Text style={styles.modalText}>
                  Material: {recyclableInfo.material || 'Unknown'}
                </Text>
              </>
            )}
            <Pressable
              onPress={() => {
                setScanned(false);
                setRecyclableInfo(null);
              }}
              style={styles.scanAgainButton}
            >
              <Text style={{ color: '#fff' }}>Scan Another</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#000000a0',
    padding: 20,
    borderRadius: 10,
  },
  guideBox: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: '80%',
    height: '30%',
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
});
