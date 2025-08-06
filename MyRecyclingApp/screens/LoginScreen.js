import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import * as Notifications from 'expo-notifications';


import { API_BASE_URL } from '../config';
import * as Location from 'expo-location';

// Computes distance (in meters) between two lat/lon points
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) { return deg * (Math.PI / 180); }
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DISTANCE_THRESHOLD = 1000; // in meters

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Normalize and authenticate
      const normalizedEmail = email.trim().toLowerCase();
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email: normalizedEmail, password }
      );

      if (response.status !== 200) {
        setError(response.data.message || 'Invalid credentials');
        setPassword('');
        return;
      }

      const { user, token } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');

      // Register push token for this user
try {
  const { data: { expoPushToken } } = await Notifications.getExpoPushTokenAsync();
  if (expoPushToken) {
    await AsyncStorage.setItem('expoPushToken', expoPushToken);
    await axios.post(
      `${API_BASE_URL}/api/user/register-push-token`,
      { token: expoPushToken },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
} catch (pushErr) {
  console.warn('Could not register push token:', pushErr);
}

      Alert.alert('Success', `Welcome, ${user.name}!`);
      if (user.role === 'admin') {
        navigation.replace('Admin');
        return;
      }

      // Determine the actual user ID field
      const realId = user._id || user.id;

      // 1) Look up saved coords for this user
      const userKey = `lastLocation_${realId}`;
      const saved = await AsyncStorage.getItem(userKey);
      if (!saved) {
        // No saved location → ask permission
        navigation.replace('LocationPermission', { userId: realId });
        return;
      }

      // 2) Parse saved location
      let lastLocation;
      try {
        lastLocation = JSON.parse(saved);
      } catch {
        navigation.replace('LocationPermission', { userId: realId });
        return;
      }

      // 3) Ensure permission still granted
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        navigation.replace('LocationPermission', { userId: realId });
        return;
      }

      // 4) Try to get current position, fallback on saved
      let current;
      try {
        current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
      } catch {
        navigation.replace('User', {
          screen: 'MainApp',
          params: { userLocation: lastLocation },
        });
        return;
      }

      // 5) Compute distance and decide
      const distance = getDistanceFromLatLonInMeters(
        lastLocation.latitude,
        lastLocation.longitude,
        current.coords.latitude,
        current.coords.longitude
      );
      if (distance > DISTANCE_THRESHOLD) {
        navigation.replace('LocationPermission', { userId: realId });
      } else {
        navigation.replace('User', {
          screen: 'MainApp',
          params: { userLocation: lastLocation },
        });
      }

    } catch (loginError) {
      console.error('Login Error:', loginError);
      setError(loginError.response?.data?.message || 'Something went wrong');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hi, Welcome! 👋</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
          value={email}
          editable={!loading}
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
            value={password}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          status={rememberMe ? 'checked' : 'unchecked'}
          onPress={() => setRememberMe(!rememberMe)}
          color="#388e3c"
          uncheckedColor="#999"
          disabled={loading}
        />
        <Text style={styles.checkboxLabel}>Remember Me</Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={loading}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR Login with</Text>
        <View style={styles.line} />
      </View>

      {/* Social buttons... */}

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16, justifyContent: 'center' },
  header: { marginTop: 150, paddingHorizontal: 40, fontSize: 28, fontWeight: 'bold', color: '#4D3E3E', marginBottom: 32 },
  inputContainer: { marginBottom: 12 },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D8DADC', marginBottom: 16, fontSize: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, alignSelf: 'center', width: '100%', maxWidth: 340 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D8DADC', paddingHorizontal: 14, marginBottom: 16, alignSelf: 'center', width: '100%', maxWidth: 340 },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 16 },
  eyeIcon: { marginLeft: 10 },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  checkboxLabel: { fontSize: 16, color: '#333' },
  forgotPassword: { color: '#000', fontWeight: '600', textAlign: 'right', marginBottom: 24, paddingHorizontal: 8, alignSelf: 'center', maxWidth: 340 },
  button: { backgroundColor: '#9DD549', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24, alignSelf: 'center', width: '100%', maxWidth: 320 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  orContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, gap: 8, paddingHorizontal: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#D8DADC' },
  orText: { textAlign: 'center', marginHorizontal: 8, fontSize: 14, color: '#000', fontWeight: '600' },
  link: { color: '#000', fontSize: 15, textAlign: 'center' },
  linkBold: { fontWeight: 'bold', color: '#388E3C' },
});
