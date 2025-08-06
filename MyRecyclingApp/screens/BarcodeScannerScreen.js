import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recyclableInfo, setRecyclableInfo] = useState(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  // Map API material responses to guide material keys
  const getMaterialKey = (material) => {
    if (!material || material === 'Unknown') return null;
    
    const materialLower = material.toLowerCase();
    
    // Map common material types to guide keys (matching your API responses)
    const materialMap = {
      // Direct plastic types from your API
      'polypropylene': 'plastic',
      'polyethylene terephthalate': 'plastic',
      'high-density polyethylene': 'plastic',
      'low-density polyethylene': 'plastic',
      'polystyrene': 'plastic',
      'plastic': 'plastic',
      'pet': 'plastic',
      'hdpe': 'plastic',
      'ldpe': 'plastic',
      'pp': 'plastic',
      'ps': 'plastic',
      
      // Paper materials
      'paper': 'paper',
      'cardboard': 'paper',
      'envelope': 'paper',
      'carton': 'carton',
      
      // Glass and metals
      'glass': 'glass',
      'metal': 'metal',
      'aluminum': 'metal',
      'iron': 'metal',
      'steel': 'metal',
      
      // Other materials
      'electronic': 'ewaste',
      'electronics': 'ewaste',
      'battery': 'batteries',
      'textile': 'clothes',
      'fabric': 'clothes',
      'tire': 'tires',
      'rubber': 'tires',
      'organic': 'organic',
      'compost': 'organic',
      'construction': 'construction',
      'concrete': 'construction',
      'wood': 'construction'
    };

    // Find matching material key - check both full string and individual words
    for (const [key, value] of Object.entries(materialMap)) {
      if (materialLower.includes(key) || materialLower === key) {
        return value;
      }
    }
    
    // Handle comma-separated materials (e.g., "Paper, Cardboard")
    const materials = materialLower.split(',').map(m => m.trim());
    for (const mat of materials) {
      for (const [key, value] of Object.entries(materialMap)) {
        if (mat.includes(key) || mat === key) {
          return value;
        }
      }
    }
    
    return null; // No matching guide found
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const response = await axios.get(`${API_BASE_URL}/api/recyclables/${data}`);
      
      // Enhanced response with guide material key
      const materialKey = getMaterialKey(response.data.material);
      
      setRecyclableInfo({
        recyclable: response.data.recyclable,
        material: response.data.material,
        message: response.data.message,
        materialKey: materialKey,
        showGuideButton: materialKey !== null && response.data.recyclable
      });
    } catch (error) {
      setRecyclableInfo({ 
        error: true, 
        message: 'Item not found or not recyclable',
        showGuideButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewGuide = () => {
    if (recyclableInfo?.materialKey) {
      // Close modal first
      setScanned(false);
      setRecyclableInfo(null);
      
      // Navigate to guide with material parameter
      navigation.navigate('Guide', { material: recyclableInfo.materialKey });
    }
  };

  const handleScanAnother = () => {
    setScanned(false);
    setRecyclableInfo(null);
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
            "aztec",
            "ean13",
            "ean8",
            "qr",
            "pdf417",
            "upc_e",
            "datamatrix",
            "code39",
            "code93",
            "itf14",
            "codabar",
            "code128",
            "upc_a"
          ],
        }}
      />

      {/* 📦 Guide Box */}
      <View style={styles.guideBox} />

      {/* 🔄 Loading indicator */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Checking recyclability...</Text>
        </View>
      )}

      {/* ✅ Modal for result */}
      <Modal visible={recyclableInfo !== null} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {recyclableInfo?.error ? (
              <>
                <Text style={styles.modalTitle}>🚫 Not Recyclable</Text>
                <Text style={styles.modalText}>{recyclableInfo.message}</Text>
              </>
            ) : recyclableInfo?.recyclable === false ? (
              <>
                <Text style={styles.modalTitle}>❌ Not Recyclable</Text>
                <Text style={styles.modalText}>
                  Material: {recyclableInfo?.material}
                </Text>
                {recyclableInfo?.message && (
                  <Text style={styles.errorText}>{recyclableInfo.message}</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>♻️ Recyclable</Text>
                <Text style={styles.modalText}>
                  Material: {recyclableInfo?.material}
                </Text>
                {recyclableInfo?.showGuideButton && (
                  <Text style={styles.guideHint}>
                    View our recycling guide for detailed instructions!
                  </Text>
                )}
              </>
            )}
            
            <View style={styles.buttonContainer}>
              {/* Show View Guide button only for recyclable items with matching guide */}
              {recyclableInfo?.showGuideButton && recyclableInfo?.recyclable && (
                <Pressable
                  onPress={handleViewGuide}
                  style={[styles.button, styles.guideButton]}
                >
                  <Text style={styles.buttonText}>📖 View Guide</Text>
                </Pressable>
              )}
              
              <Pressable
                onPress={handleScanAnother}
                style={[styles.button, styles.scanAgainButton]}
              >
                <Text style={styles.buttonText}>🔄 Scan Another</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  guideHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  guideButton: {
    backgroundColor: '#2196F3',
  },
  scanAgainButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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