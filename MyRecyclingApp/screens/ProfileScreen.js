// screens/ProfileScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';

export default function ProfileScreen({ navigation, route }) {
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);

  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '--',
    age: '--',
    profilePhotoUrl: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const u = res.data.user;
      const savedAvatar = await AsyncStorage.getItem('userAvatar');

      setUser({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        gender: u.gender || '--',
        age: u.dateOfBirth
          ? new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear()
          : '--',
        profilePhotoUrl: savedAvatar || u.profilePhotoUrl || null,
      });
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const savedAvatar = await AsyncStorage.getItem('userAvatar');
        setUser(prev => ({
          ...prev,
          profilePhotoUrl: savedAvatar || prev.profilePhotoUrl,
          ...route.params?.updatedInfo,
        }));
      })();
    }, [route.params])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData().finally(() => setRefreshing(false));
  }, []);

  // Handle image pick
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'We need access to your photos to change your profile picture.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.cancelled) {
      await AsyncStorage.setItem('userAvatar', result.uri);
      setUser(prev => ({ ...prev, profilePhotoUrl: result.uri }));
    }
  };

  const detailItems = [
    { label: 'Edit Profile', icon: 'person-outline', action: () => navigation.navigate('EditProfile', { currentUser: user }) },
    { label: 'Password', icon: 'lock-closed-outline', action: () => navigation.navigate('Password') },
    { label: 'Contact Info', icon: 'call-outline', action: () => setModalVisible(true) },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <Image
              key={user.profilePhotoUrl}
              source={
                user.profilePhotoUrl
                  ? { uri: user.profilePhotoUrl }
                  : require('../assets/avatar-placeholder.png')
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.nameText}>{user.name}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <Text style={styles.subText}>
              {user.gender}, {user.age} yrs
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Details</Text>
        {detailItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.detailItem}
            onPress={item.action}
          >
            <View style={styles.detailLeft}>
              <Ionicons name={item.icon} size={20} color={colors.tint} />
              <Text style={styles.detailLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: darkMode ? colors.card : '#fff' }]}>  
            <Text style={[styles.modalHeader, { color: colors.text }]}>Contact Info</Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Email: {user.email}
            </Text>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Phone: {user.phone}
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.tint }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.closeText, { color: colors.bg }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (c, dark) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: dark ? c.bg : '#F9FBF9' },
    container: { padding: 20, backgroundColor: dark ? c.bg : '#F9FBF9' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: dark ? c.text : '#111827', marginBottom: 20 },
    profileBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? c.card : '#DFFFE0', padding: 16, borderRadius: 16, marginBottom: 30 },
    avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16, backgroundColor: '#E0E0E0' },
    nameText: { fontSize: 18, fontWeight: '600', color: c.text },
    emailText: { fontSize: 14, fontWeight: '400', color: c.text },
    subText: { fontSize: 14, marginTop: 4, color: c.textSecondary },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: c.text },
    detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: dark ? c.card : '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 12, elevation: 1 },
    detailLeft: { flexDirection: 'row', alignItems: 'center' },
    detailLabel: { marginLeft: 12, fontSize: 15, fontWeight: '500', color: c.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', borderRadius: 16, padding: 20 },
    modalHeader: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    modalText: { fontSize: 15, marginBottom: 8 },
    closeBtn: { marginTop: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    closeText: { fontWeight: '600' },
  });
