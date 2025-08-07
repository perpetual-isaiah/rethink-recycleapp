// screens/ResetCodeScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function ResetCodeScreen({ route, navigation }) {
  const { email } = route.params;

  /* ---------- CODE INPUT ---------- */
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  /* ---------- MODAL & PASSWORD ---------- */
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ---------- LOADING ---------- */
  const [loading, setLoading] = useState(false);

  /* ---------- Helpers ---------- */
  const handleDigitChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const updated = [...digits];
      updated[index] = value;
      setDigits(updated);

      // auto-focus next / previous
      if (value && index < 5) inputs.current[index + 1]?.focus();
      if (!value && index > 0) inputs.current[index - 1]?.focus();
    }
  };

  /* ---------- 1. VERIFY CODE ---------- */
  const verifyCode = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        email,
        code,
      }); // ✅ adjust route if needed
      setPasswordModalVisible(true); // open modal
    } catch (err) {
      console.error('Code verify error:', err.response?.data || err.message);
      Alert.alert(
        'Invalid Code',
        err.response?.data?.message || 'The code you entered is incorrect.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 2. RESET PASSWORD ---------- */
  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        code: digits.join(''),
        newPassword,
      });
      Alert.alert('Success', 'Password reset successful.');
      setPasswordModalVisible(false);
      navigation.navigate('Login');
    } catch (err) {
      console.error('Reset error:', err.response?.data || err.message);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to reset password.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- RENDER ---------- */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.inner}
      >
        <Text style={styles.header}>Enter Verification Code</Text>

        <View style={styles.codeContainer}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleDigitChange(value, index)}
              autoFocus={index === 0}
              returnKeyType="next"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={verifyCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

     
     {/* ---------- PASSWORD MODAL ---------- */}
<Modal
  animationType="slide"
  transparent={true}
  visible={passwordModalVisible}
  onRequestClose={() => setPasswordModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalHeader}>Reset Password</Text>

      {/* New Password */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#757575"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword((p) => !p)}
        >
          <Ionicons
            name={showPassword ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#757575"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword((p) => !p)}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={resetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save New Password</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 58,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    fontSize: 20,
    textAlign: 'center',
    color: '#000',
  },
  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 20,
    alignSelf: 'center',
  },

  /* password fields */
  passwordWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    fontSize: 16,
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 14,
  },
});
