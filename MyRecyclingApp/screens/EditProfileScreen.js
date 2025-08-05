// screens/EditProfileScreen.js
import ModalSelector from 'react-native-modal-selector';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';

// Pull values from app.json extra
const { cloudinaryCloudName, cloudinaryUploadPreset } = Constants.expoConfig.extra;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;

export default function EditProfileScreen({ navigation, route }) {
  const { currentUser } = route.params;
  const { colors, darkMode } = useTheme();

  const [phone, setPhone] = useState(currentUser.phone || '');
  const [gender, setGender] = useState(currentUser.gender || '--');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [avatar, setAvatar] = useState(currentUser.profilePhotoUrl || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Ask for media library permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'We need access to your photos to change your profile picture.'
        );
      }
    })();
  }, []);

  // Upload helper
  const uploadToCloudinary = async (uri) => {
    const form = new FormData();
    form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
    form.append('upload_preset', cloudinaryUploadPreset);
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Cloudinary upload failed');
    return data.secure_url;
  };

  const commonOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(commonOptions);
    if (!result.canceled) handleImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(commonOptions);
    if (!result.canceled) handleImage(result.assets[0].uri);
  };

  const handlePickImage = () => {
    Alert.alert(
      'Select Image',
      'Choose source',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleImage = async (uri) => {
    try {
      setUploading(true);
      const url = await uploadToCloudinary(uri);
      setAvatar(url);
      await AsyncStorage.setItem('userAvatar', url);
    } catch (e) {
      console.error(e);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/user/profile`,
        { phone, gender: gender === '--' ? null : gender, dateOfBirth: dob, profilePhotoUrl: avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated');
      navigation.navigate('Profile', {
        updatedInfo: {
          phone,
          gender,
          age: dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null,
          profilePhotoUrl: avatar,
        },
      });
    } catch (e) {
      console.error(e.response?.data || e);
      Alert.alert('Error', e.response?.data?.message || 'Server error');
    }
  };

  const genderOptions = [
    { key: '--', label: '--' },
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: darkMode ? colors.bg : '#F4FBF5' },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: darkMode ? colors.bg : '#F9FBF9' },
        ]}
      >
        <Text
          style={[
            styles.header,
            { color: darkMode ? colors.text : '#111827' },
          ]}
        >
          Edit Profile
        </Text>

        {/* Avatar Section */}
        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploading}
          style={styles.avatarContainer}
        >
          {uploading ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: darkMode ? colors.card : '#E0E0E0' },
              ]}
            >
              <Ionicons
                name="camera"
                size={40}
                color={darkMode ? colors.textSecondary : '#999'}
              />
            </View>
          )}
        </TouchableOpacity>
        <Text
          style={[
            styles.avatarHint,
            { color: darkMode ? colors.textSecondary : '#888' },
          ]}
        >
          {uploading ? 'Uploading...' : 'Tap photo to change'}
        </Text>

        {/* Inputs */}
        <View style={styles.inputWrapper}>
          <Text
            style={[
              styles.label,
              { color: darkMode ? colors.text : '#555' },
            ]}
          >
            Full Name
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.disabledInput,
              {
                backgroundColor: darkMode ? colors.card : '#F3F4F6',
                color: darkMode ? colors.textSecondary : '#9CA3AF',
              },
            ]}
            value={currentUser.name}
            editable={false}
          />
        </View>
        <View style={styles.inputWrapper}>
          <Text
            style={[
              styles.label,
              { color: darkMode ? colors.text : '#555' },
            ]}
          >
            Email
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.disabledInput,
              {
                backgroundColor: darkMode ? colors.card : '#F3F4F6',
                color: darkMode ? colors.textSecondary : '#9CA3AF',
              },
            ]}
            value={currentUser.email}
            editable={false}
          />
        </View>
        <View style={styles.inputWrapper}>
          <Text
            style={[
              styles.label,
              { color: darkMode ? colors.text : '#555' },
            ]}
          >
            Phone
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: darkMode ? colors.card : '#fff',
                color: darkMode ? colors.text : '#111827',
              },
            ]}
            value={phone}
            keyboardType="phone-pad"
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={
              darkMode ? colors.textSecondary : '#999'
            }
          />
        </View>
        <View style={styles.inputWrapper}>
          <Text
            style={[
              styles.label,
              { color: darkMode ? colors.text : '#555' },
            ]}
          >
            Gender
          </Text>
          <ModalSelector
            data={genderOptions}
            initValue="Select gender"
            onChange={(opt) => setGender(opt.key)}
            selectStyle={[
              styles.pickerWrapper,
              { backgroundColor: darkMode ? colors.card : '#fff' },
            ]}
            selectTextStyle={[
              styles.pickerText,
              {
                color:
                  darkMode && gender === '--'
                    ? colors.textSecondary
                    : darkMode
                    ? colors.text
                    : '#111827',
              },
            ]}
          >
            <View style={styles.selectorInner}>
              <Text
                style={[
                  styles.pickerText,
                  {
                    color:
                      darkMode && gender === '--'
                        ? colors.textSecondary
                        : darkMode
                        ? colors.text
                        : '#111827',
                  },
                ]}
              >
                {genderOptions.find((o) => o.key === gender)?.label ||
                  'Select gender'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={darkMode ? colors.textSecondary : '#999'}
              />
            </View>
          </ModalSelector>
        </View>
        <View style={styles.inputWrapper}>
          <Text
            style={[
              styles.label,
              { color: darkMode ? colors.text : '#555' },
            ]}
          >
            Date of Birth
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.input,
              { backgroundColor: darkMode ? colors.card : '#fff' },
            ]}
          >
            <Text
              style={[
                styles.dateText,
                {
                  color: dob
                    ? darkMode
                      ? colors.text
                      : '#111827'
                    : darkMode
                    ? colors.textSecondary
                    : '#999',
                },
              ]}
            >
              {dob
                ? new Date(dob).toDateString()
                : 'Select date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) setDob(d.toISOString());
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.tint }]}
          onPress={handleSave}
          disabled={uploading}
        >
          <Text style={[styles.saveText, { color: colors.bg }]}>  
            {uploading ? 'Saving…' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20, alignSelf: 'center' },
  avatarContainer: { alignSelf: 'center', marginBottom: 10, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
  avatarLoading: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' },
  avatarHint: { textAlign: 'center', marginBottom: 16, fontSize: 14 },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '500' },
  input: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15 },
  disabledInput: {},
  dateText: { fontSize: 15 },
  pickerWrapper: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', height: 50, justifyContent: 'center', paddingLeft: 12, paddingRight: 12 },
  pickerText: { fontSize: 15 },
  selectorInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 12 },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { fontSize: 16, fontWeight: '600' },
});
