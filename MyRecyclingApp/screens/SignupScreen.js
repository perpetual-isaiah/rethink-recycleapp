import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      const emailLower = email.trim().toLowerCase();
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: emailLower, password }),
      });

      const data = await response.json();

      if (response.status === 201) {
        Alert.alert(
          'Success',
          'Account created! Please check your email to verify your account.'
        );
        navigation.navigate('VerifyEmail', { email: emailLower });
      } else {
        Alert.alert('Signup Failed', data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Signup Error:', error);
      Alert.alert('Network Error', 'Could not connect to server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subtext}>Start your recycling journey</Text>

          <TextInput
            placeholder="Name"
            style={styles.input}
            onChangeText={setName}
            value={name}
          />

          <TextInput
            placeholder="Email"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={22} color="#888" />

            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Confirm Password"
              style={styles.passwordInput}
              secureTextEntry={!showConfirmPassword}
              onChangeText={setConfirmPassword}
              value={confirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={22} color="#888" />

            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR Register with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-google" size={28} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-apple" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
  style={{ marginTop: 20, alignSelf: 'center' }}
  onPress={() => navigation.navigate('Congratulations')}
>
  <Text style={{ color: '#388E3C', fontWeight: 'bold' }}>
    Go to Congratulations Screen (Test)
  </Text>
</TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', //#F5FEED',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 40,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4D3E3E',//1B5E20 
    textAlign: 'left',
    marginTop: 150,
    marginBottom: 6,
  },
  subtext: {
    paddingHorizontal: 40,
    fontSize: 16,
    color: '#4D3E3E', //#4CAF50
    textAlign: 'left',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DADC', // c8e6c9
    marginBottom: 16,
    fontSize: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:'#D8DADC', //'#c8e6c9',
    marginBottom: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#9DD549', //388E3C  
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  link: {
    color: '#000000', //#388E3C
    fontSize: 15,
    textAlign: 'center',
  },
  linkBold: {
    fontWeight: 'bold',
     color: '#388E3C', //#388E3C
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  orText: {
    textAlign: 'center',
    color: '#000000', // 000000  CAF450
    fontWeight: '600',
    fontSize: 14,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8DADC', //A5D6A7  
  },
});
