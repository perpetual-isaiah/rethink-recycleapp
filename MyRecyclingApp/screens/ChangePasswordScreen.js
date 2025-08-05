// screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setRefreshing(false);
  };

  const passwordValidations = {
    minLength:     newPassword.length >= 8,
    hasUppercase:  /[A-Z]/.test(newPassword),
    hasNumber:     /\d/.test(newPassword),
    hasSpecialChar:/[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordValidations).every(v => v);
  const passwordsMatch   = newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!passwordsMatch) {
      return Alert.alert('Error', 'New password and confirmation do not match.');
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Password changed. Please log in again.');
        await AsyncStorage.removeItem('token');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to change password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Change Password</Text>

        {/** Current Password **/}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)}>
              <Icon
                name={showPasswords ? 'eye' : 'eye-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/** New Password **/}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords}
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter new password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)}>
              <Icon
                name={showPasswords ? 'eye' : 'eye-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {isFocused && (
            <View style={styles.requirements}>
              <Text style={passwordValidations.minLength ? styles.valid : styles.invalid}>
                • Min 8 characters
              </Text>
              <Text style={passwordValidations.hasUppercase ? styles.valid : styles.invalid}>
                • 1 uppercase letter
              </Text>
              <Text style={passwordValidations.hasNumber ? styles.valid : styles.invalid}>
                • 1 number
              </Text>
              <Text style={passwordValidations.hasSpecialChar ? styles.valid : styles.invalid}>
                • 1 special character
              </Text>
            </View>
          )}
        </View>

        {/** Confirm Password **/}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPasswords}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)}>
              <Icon
                name={showPasswords ? 'eye' : 'eye-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/** Submit Button **/}
        <TouchableOpacity
          style={[
            styles.button,
            !(isPasswordValid && passwordsMatch) && styles.buttonDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={!(isPasswordValid && passwordsMatch)}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

const getStyles = (c, dark) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    container: {
      padding: 20,
      backgroundColor: c.bg,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 30,
      textAlign: 'center',
      color: c.text,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      marginBottom: 6,
      fontSize: 16,
      fontWeight: '500',
      color: c.text,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.separator,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      height: 48,
      color: c.text,
    },
    requirements: {
      marginTop: 8,
      paddingLeft: 10,
    },
    valid: {
      color: c.success,
    },
    invalid: {
      color: c.textSecondary,
    },
    button: {
      backgroundColor: c.tint,
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 10,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: c.separator,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
