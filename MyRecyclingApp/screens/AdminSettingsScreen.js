// screens/AdminSettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSettingsScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- pull-to-refresh (optional) ---------- */
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  /* ---------- logout ---------- */
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  /* ---------- render ---------- */
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>

        <Text style={s.header}>Settings</Text>

        {/* Profile row */}
        <TouchableOpacity style={s.row} onPress={() => navigation.navigate('AdminProfile')}>
          <Ionicons name="person-circle-outline" size={24} color="#4CAF50" />
          <Text style={s.rowText}>Profile</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={s.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F8' },
  container: { padding: 24 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: '#333' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  rowText: { fontSize: 16, marginLeft: 12, color: '#555' },
  logout: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
});
