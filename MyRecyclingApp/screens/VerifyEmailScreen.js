import React, { useRef, useState } from 'react';
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

import { API_BASE_URL } from '../config';

export default function VerifyEmailScreen({ navigation, route }) {
  const { email } = route.params || {};

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const updated = [...digits];
      updated[index] = text;
      setDigits(updated);

      if (text && index < 5) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter all 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Alert.alert('Success', 'Email verified! You can now log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Verification Failed', data.message || 'Invalid or expired code.');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      Alert.alert('Network Error', 'Unable to verify at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not provided.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Alert.alert('Success', 'Verification code resent! Please check your email.');
      } else {
        Alert.alert('Error', data.message || 'Could not resend code.');
      }
    } catch (error) {
      console.error('Resend Error:', error);
      Alert.alert('Network Error', 'Unable to resend code at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Verify Your Email</Text>
      <Text style={styles.subtext}>
  Enter the 6-digit code sent to{email ? '\n' : ' '}
  {email ? (
    <Text style={styles.emailText}>{email}</Text>
  ) : (
    'your email'
  )}
  .
</Text>


      <View style={styles.codeContainer}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref)}
            style={styles.codeInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!loading}
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={loading}>
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', //'#F4FEED',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 32,
    textAlign: 'center',
    
  },
 
codeContainer: {
  flexDirection: 'row',
  justifyContent: 'center',    // center inputs, no big gaps on sides
  marginBottom: 32,
  // remove paddingHorizontal here
},
codeInput: {
  marginHorizontal: 6,        // small spacing between inputs
  width: 48,
  height: 56,
  fontSize: 20,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#c8e6c9',
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 2,
  textAlign: 'center',
},

  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    width: '90%',          // or a fixed value like 320
  alignSelf: 'center',   // center horizontally
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resendText: {
    color: '#388E3C',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    color: '#388E3C',
    fontSize: 15,
    textAlign: 'center',
  },
  emailText: {
  color: 'black', 
  fontWeight: '600',
},

});
