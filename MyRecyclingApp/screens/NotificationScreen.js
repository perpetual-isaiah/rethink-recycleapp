import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet, Alert, Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for notification listeners
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Push Notifications',
          'Failed to get push token for push notification!',
          [{ text: 'OK' }]
        );
        return;
      }
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('Push token generated:', token);
        setExpoPushToken(token);
        
        // Save token to backend
        await savePushTokenToBackend(token);
        
      } catch (error) {
        console.error('Error getting push token:', error);
        Alert.alert(
          'Push Notifications',
          'Error setting up push notifications. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        'Push Notifications',
        'Must use physical device for Push Notifications',
        [{ text: 'OK' }]
      );
    }

    return token;
  };

  // Save push token to your backend
  const savePushTokenToBackend = async (token) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('No auth token available, skipping push token save');
        return;
      }
      
      await axios.post(
        `${API_BASE_URL}/api/user/savePushToken`,
        { pushToken: token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Push token saved to backend successfully');
    } catch (error) {
      console.error('Error saving push token to backend:', error);
    }
  };

  // Get auth token from AsyncStorage (matches your HomeScreen setup)
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = await getAuthToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const res = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
      const notificationData = Array.isArray(res.data) ? res.data : res.data?.notifications || [];
      setNotifications(notificationData);
      
      // Update unread count with null safety
      const unread = notificationData.filter(n => n && !n.read).length;
      setUnreadCount(unread);
      
      console.log('🔵 Notifications loaded:', notificationData.length, 'Unread:', unread);
    } catch (err) {
      setError('Failed to load notifications.');
      console.error('❌ Failed to load notifications:', err?.message, err?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!notificationId) {
      console.error('No notification ID provided');
      return;
    }

    try {
      const authToken = await getAuthToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      await axios.patch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers }
      );
      
      setNotifications(prev => {
        const updated = prev.map(notification =>
          notification && notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        );
        // Update unread count with null safety
        const unread = updated.filter(n => n && !n.read).length;
        setUnreadCount(unread);
        return updated;
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notification as read.');
      console.error('Failed to mark as read:', err?.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const authToken = await getAuthToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      // Get all unread notification IDs with null safety
      const unreadNotifications = notifications.filter(n => n && !n.read);
      
      if (unreadNotifications.length === 0) {
        return; // No unread notifications
      }
      
      // Make API call to mark all as read
      await axios.patch(
        `${API_BASE_URL}/api/notifications/mark-all-read`, 
        {},
        { headers }
      );
      
      // Update local state with null safety
      setNotifications(prev => 
        prev.map(notification => notification ? { ...notification, read: true } : notification)
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      console.log('All notifications marked as read');
    } catch (err) {
      Alert.alert('Error', 'Failed to mark all notifications as read.');
      console.error('Failed to mark all as read:', err?.message);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!notificationId) {
      console.error('No notification ID provided');
      return;
    }

    try {
      const authToken = await getAuthToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      // Show confirmation dialog
      Alert.alert(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await axios.delete(
                  `${API_BASE_URL}/api/notifications/${notificationId}`,
                  { headers }
                );
                
                // Update local state with null safety
                setNotifications(prev => {
                  const updated = prev.filter(n => n && n._id !== notificationId);
                  // Update unread count
                  const unread = updated.filter(n => n && !n.read).length;
                  setUnreadCount(unread);
                  return updated;
                });
                
                console.log('Notification deleted successfully');
              } catch (deleteErr) {
                Alert.alert('Error', 'Failed to delete notification.');
                console.error('Failed to delete notification:', deleteErr?.message);
              }
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to delete notification.');
      console.error('Failed to delete notification:', err?.message);
    }
  };

  // Handle notification tap when app is in foreground or background
  const handleNotificationTap = (notification) => {
    console.log('Notification tapped:', notification);
    
    const data = notification?.request?.content?.data;
    
    // Handle different notification types with null safety
    if (data?.type) {
      switch (data.type) {
        case 'challenge_created':
        case 'challenge_approved':
        case 'challenge_joined':
          navigation.navigate('MyChallenges');
          break;
        case 'reward_earned':
        case 'reward':
          navigation.navigate('Activity', { defaultTab: 'rewards' });
          break;
        case 'challenge_completed':
          navigation.navigate('MyChallenges');
          break;
        default:
          // For generic notifications, stay on notifications screen
          break;
      }
    }
  };

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();

    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received in NotificationScreen:', notification);
      // Refresh notifications list to show the new one
      fetchNotifications();
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification response in NotificationScreen:', response);
      handleNotificationTap(response?.notification);
    });

    // ✅ FIXED: Use the new .remove() method instead of removeNotificationSubscription
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Test push notification function (for development)
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 📬",
          body: 'This is a test notification from NotificationScreen!',
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with actions */}
      {notifications.length > 0 && (
        <View style={[styles.headerActions, { borderBottomColor: colors.separator }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </Text>
          <View style={styles.actionButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
                <Text style={[styles.actionButtonText, { color: colors.tint }]}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No notifications
            </Text>
            {error && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            )}
            <TouchableOpacity
              onPress={fetchNotifications}
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            {/* Test notification button - remove in production */}
            {__DEV__ && expoPushToken && (
              <TouchableOpacity
                onPress={sendTestNotification}
                style={[styles.testButton, { backgroundColor: colors.tint, marginTop: 10 }]}
              >
                <Text style={styles.retryButtonText}>Send Test Notification</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          // Add null safety for item
          if (!item) {
            return null;
          }
          
          return (
            <View style={styles.notificationWrapper}>
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  {
                    backgroundColor: item.read ? colors.bg : colors.card,
                    borderBottomColor: colors.separator,
                  },
                ]}
                onPress={() => markAsRead(item._id)}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        {
                          color: colors.text,
                          fontWeight: item.read ? '400' : '600',
                        },
                      ]}
                    >
                      {item.message || `Notification ${index + 1}`}
                    </Text>
                    {!item.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
                    )}
                  </View>
                  <View style={styles.notificationFooter}>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                      {formatDate(item.createdAt)}
                    </Text>
                    {item.type && (
                      <Text style={[styles.notificationType, { color: colors.textSecondary }]}>
                        {item.type}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Delete button */}
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.danger || '#ff4444' }]}
                onPress={() => deleteNotification(item._id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      
      {/* Push token display for debugging - remove in production */}
      {__DEV__ && expoPushToken && (
        <View style={[styles.debugContainer, { borderTopColor: colors.separator }]}>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Push Token: {expoPushToken.substring(0, 20)}...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  testButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  notificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationItem: {
    flex: 1,
    padding: 16,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugContainer: {
    padding: 10,
    borderTopWidth: 1,
  },
  debugText: {
    fontSize: 10,
    textAlign: 'center',
  },
});