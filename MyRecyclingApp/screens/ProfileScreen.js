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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import Constants from 'expo-constants';

/* ----------- Cloudinary ----------- */
const { cloudinaryCloudName, cloudinaryUploadPreset } =
  Constants.expoConfig.extra;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;

export default function ProfileScreen({ navigation, route }) {
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);

  /* ----------- state ----------- */
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '--',
    age: '--',
    dob: '', // ISO string for EditProfile
    profilePhotoUrl: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  /* ----------- helpers ----------- */
  const uploadToCloudinary = async (uri) => {
    const form = new FormData();
    form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
    form.append('upload_preset', cloudinaryUploadPreset);

    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Cloudinary upload failed');
    return data.secure_url;
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const u = data.user;

      setUser({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        gender: u.gender || '--',
        dob: u.dateOfBirth || '',
        age: u.dateOfBirth
          ? new Date().getFullYear() -
            new Date(u.dateOfBirth).getFullYear()
          : '--',
        profilePhotoUrl: u.profilePhotoUrl || null,
      });
    } catch (err) {
      console.error('❌ Failed to fetch user:', err);
    }
  };

  /* ----------- effects ----------- */
  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // when EditProfile returns with updatedInfo
      if (route.params?.updatedInfo) {
        setUser((prev) => ({ ...prev, ...route.params.updatedInfo }));
      }
    }, [route.params]),
  );

  /* ----------- pull-to-refresh ----------- */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData().finally(() => setRefreshing(false));
  }, []);

  /* ===========================
        Avatar change flow
     =========================== */

  const processSelectedImage = async (uri) => {
    try {
      setUploading(true);
      const url = await uploadToCloudinary(uri);

      // push to backend
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/user/profile`,
        { profilePhotoUrl: url },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await AsyncStorage.setItem('userAvatar', url);
      setUser((prev) => ({ ...prev, profilePhotoUrl: url }));
    } catch (err) {
      console.error(err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Camera access is needed to take a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Photo library access is needed.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Change profile photo',
      'Select image source',
      [
        { text: 'Take photo', onPress: handleTakePhoto },
        { text: 'Choose from gallery', onPress: handleChooseFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  /* ----------- render ----------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text style={styles.headerTitle}>Account</Text>

        {/* profile card */}
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Image
                  source={
                    user.profilePhotoUrl
                      ? { uri: user.profilePhotoUrl }
                      : require('../assets/avatar-placeholder.png')
                  }
                  style={styles.avatar}
                />
              )}
              {/* “＋” badge */}
              <View style={styles.plusBadge}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.nameText}>{user.name}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <Text style={styles.subText}>
              {user.gender}, {user.age} yrs
            </Text>
          </View>
        </View>

        {/* options */}
        <Text style={styles.sectionTitle}>Account Details</Text>
        {[
          {
            label: 'Edit Profile',
            icon: 'person-outline',
            action: () =>
              navigation.navigate('EditProfile', { currentUser: user }),
          },
          {
            label: 'Password',
            icon: 'lock-closed-outline',
            action: () => navigation.navigate('Password'),
          },
          {
            label: 'Contact Info',
            icon: 'call-outline',
            action: () => setModalVisible(true),
          },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.detailItem}
            onPress={item.action}>
            <View style={styles.detailLeft}>
              <Ionicons name={item.icon} size={20} color={colors.tint} />
              <Text style={styles.detailLabel}>{item.label}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ----- simple placeholder modal (customise as you like) ----- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contact Info</Text>
            <Text style={styles.modalText}>Phone: {user.phone || 'N/A'}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------- styles ----------- */
const getStyles = (c, dark) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: dark ? c.bg : '#F9FBF9' },
    container: { padding: 20 },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: dark ? c.text : '#111827',
      marginBottom: 20,
    },
    profileBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: dark ? c.card : '#DFFFE0',
      padding: 16,
      borderRadius: 16,
      marginBottom: 30,
    },
    avatarWrapper: { position: 'relative', marginRight: 16 },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#E0E0E0',
    },
    plusBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: c.tint,
      borderRadius: 10,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nameText: { fontSize: 18, fontWeight: '600', color: c.text },
    emailText: { fontSize: 14, color: c.text },
    subText: { fontSize: 14, marginTop: 4, color: c.textSecondary },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
      color: c.text,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: dark ? c.card : '#fff',
      padding: 14,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 1,
    },
    detailLeft: { flexDirection: 'row', alignItems: 'center' },
    detailLabel: {
      marginLeft: 12,
      fontSize: 15,
      fontWeight: '500',
      color: c.text,
    },
    /* modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCard: {
      width: '80%',
      padding: 20,
      backgroundColor: dark ? c.card : '#fff',
      borderRadius: 16,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: c.text, marginBottom: 8 },
    modalText: { fontSize: 15, color: c.text },
    modalCloseBtn: {
      marginTop: 16,
      backgroundColor: c.tint,
      padding: 10,
      borderRadius: 50,
    },
  });
