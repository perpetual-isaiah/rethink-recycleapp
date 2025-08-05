import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LocationPermissionScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  
  // Get userId from navigation params (passed from LoginScreen)
  const { userId } = route.params || {};

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'You need to allow location to find recycling points.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now()
      };

      // Save location with user-specific key
      if (userId) {
        const userLocationKey = `lastLocation_${userId}`;
        await AsyncStorage.setItem(userLocationKey, JSON.stringify(coords));
        console.log(`Location saved for user ${userId}:`, coords);
      } else {
        // Fallback to generic key if no userId provided (for backward compatibility)
        await AsyncStorage.setItem('lastLocation', JSON.stringify(coords));
        console.log('Location saved with generic key:', coords);
      }

      navigation.replace('User', {
        screen: 'MapScreen',
        params: { userLocation: coords },
      });

    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Show different messaging for first-time vs location-changed users
  const getLocationMessage = () => {
    if (userId) {
      return "To show nearby recycling points, we need your current location.";
    }
    return "To show nearby recycling points, we need your location.";
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.overlay}>
        <Text style={styles.title}>📍 Allow Location Access</Text>
        <Text style={styles.subtitle}>
          {getLocationMessage()}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#28a745" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={requestLocation}>
            <Text style={styles.buttonText}>Enable Location 🚀</Text>
          </TouchableOpacity>
        )}

        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#eee',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#28a745',    
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#eee',
    fontSize: 14,
    marginTop: 10,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
});