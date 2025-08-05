import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ChatUnreadBadge = ({ style }) => {
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/user-challenges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sum all unreadCount from joined (active) challenges
      const totalUnread = data
        .filter(u => u.status === 'active' && u.unreadCount)
        .reduce((sum, u) => sum + (u.unreadCount || 0), 0);
      setUnread(totalUnread);
    } catch {
      setUnread(0);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!unread) return null;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 5,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default ChatUnreadBadge;
