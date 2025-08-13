// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

import SettingsRow from '../components/SettingsRow';
import { useTheme } from '../context/ThemeContext';
import { logoutAndReset } from '../utils/auth';
import { API_BASE_URL } from '../config';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { darkMode, toggleTheme, colors, isLoading } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deleting, setDeleting] = useState(false);

  /* Load saved preference */
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('notifications_enabled');
      if (stored !== null) {
        setNotificationsEnabled(JSON.parse(stored));
      }
    })();
  }, []);

  /* Ask for permission when toggling on */
  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;

    if (next) {
      // Check current permission status first
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        // If not granted, request permission
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to use this feature.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setNotificationsEnabled(false) // Ensure switch stays off
              },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings()
              }
            ]
          );
          return false; // Don't proceed with enabling
        }
      }
    }

    // If we get here, either:
    // 1. We're disabling notifications, or
    // 2. We're enabling and permission was granted
    setNotificationsEnabled(next);
    await AsyncStorage.setItem(
      'notifications_enabled',
      JSON.stringify(next)
    );
    return true;
  };

  const confirmDelete = () => {
    if (deleting) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, continue', style: 'destructive', onPress: secondConfirmDelete },
      ]
    );
  };

  const secondConfirmDelete = () => {
    Alert.alert(
      'Final Confirmation',
      'This will permanently delete your profile, progress, and joined challenges. Proceed?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Not logged in', 'Please log in again.');
        return;
      }

      // Add timeout to the request
      await axios.delete(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000, // 30 seconds timeout
      });

      // Clear local data and reset nav
      await AsyncStorage.clear();
      Alert.alert('Account Deleted', 'Your account has been removed.');
      logoutAndReset(navigation);
    } catch (err) {
      console.error('Delete account error:', err);
      
      // Better error handling for different error types
      let errorMessage = 'Failed to delete account';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.bg }]}
      edges={['top', 'bottom']}
    >
      {isLoading ? (
        <Text style={[styles.loading, { color: colors.text }]}>
          Loading…
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.wrapper}>
          <Text style={[styles.header, { color: colors.text }]}>
            Settings
          </Text>

          {/* Preferences */}
          <Text style={[styles.subhead, { color: colors.text + 'B0' }]}>
            Preferences
          </Text>
          <SettingsRow
            label="Dark Mode"
            icon="moon-outline"
            isSwitch
            value={darkMode}
            onValueChange={toggleTheme}
            colors={colors}
          />
          <SettingsRow
            label="Enable Notifications"
            icon="notifications-outline"
            isSwitch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            colors={colors}
          />
          <SettingsRow
            label="Notifications"
            icon="notifications-circle-outline"
            onPress={() => navigation.navigate('Notifications')}
            colors={colors}
          />

          {/* Account */}
          <Text style={[styles.subhead, { color: colors.text + 'B0' }]}>
            Account
          </Text>
          <SettingsRow
            label="Change Password"
            icon="key-outline"
            onPress={() => navigation.navigate('Password')}
            colors={colors}
          />
          <SettingsRow
            label="Clear Local Data"
            icon="trash-outline"
            onPress={async () => {
              await AsyncStorage.clear();
              Alert.alert('Done', 'Local data cleared');
            }}
            colors={colors}
          />
          <SettingsRow
            label="Logout"
            icon="log-out-outline"
            danger
            onPress={() => logoutAndReset(navigation)}
            colors={colors}
          />

          {/* Delete Account */}
          <SettingsRow
            label={deleting ? 'Deleting…' : 'Delete Account'}
            icon="person-remove-outline"
            danger
            disabled={deleting}
            onPress={confirmDelete}
            colors={colors}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 20,
  },
  subhead: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  loading: {
    flex: 1,
    textAlign: 'center',
    marginTop: 40,
  },
});