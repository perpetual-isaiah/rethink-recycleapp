// screens/AdminProfileScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Image, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import Constants from 'expo-constants';

/* ---------- Cloudinary ---------- */
const { cloudinaryCloudName, cloudinaryUploadPreset } = Constants.expoConfig.extra;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;

export default function AdminProfileScreen({ route }) {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);

  /* ---------- state ---------- */
  const [admin, setAdmin] = useState({ name: '', email: '', profilePhotoUrl: null });
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* name */
  const [nameModal, setNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  /* email (multi-step) */
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStage, setEmailStage] = useState('edit');   // edit → verify
  const [code, setCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  /* password */
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  /* ---------- helpers ---------- */
  const uploadToCloudinary = async (uri) => {
    const form = new FormData();
    form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' });
    form.append('upload_preset', cloudinaryUploadPreset);
    const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Cloudinary upload failed');
    return data.secure_url;
  };

  const fetchAdmin = async () => {
    const token = await AsyncStorage.getItem('token');
    const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAdmin({
      name: data.user.name ?? '',
      email: data.user.email ?? '',
      profilePhotoUrl: data.user.profilePhotoUrl ?? null,
    });
  };

  /* ---------- effects ---------- */
  useEffect(() => { fetchAdmin(); }, []);
  useFocusEffect(useCallback(() => {
    if (route.params?.updatedEmail) setAdmin((p) => ({ ...p, email: route.params.updatedEmail }));
  }, [route.params]));

  /* ---------- pull-to-refresh ---------- */
  const onRefresh = () => { setRefreshing(true); fetchAdmin().finally(() => setRefreshing(false)); };

  /* ---------- avatar flow ---------- */
  const processSelectedImage = async (uri) => {
    try {
      setUploading(true);
      const url = await uploadToCloudinary(uri);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/user/profile`, { profilePhotoUrl: url },
        { headers: { Authorization: `Bearer ${token}` } });
      setAdmin((p) => ({ ...p, profilePhotoUrl: url }));
    } catch { Alert.alert('Upload failed', 'Please try again.'); }
    finally { setUploading(false); }
  };

  const chooseImageSource = () =>
    Alert.alert('Change profile photo', 'Select image source', [
      { text: 'Take photo', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.8 });
          if (!res.canceled) processSelectedImage(res.assets[0].uri);
        } },
      { text: 'Choose from gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8,
          });
          if (!res.canceled) processSelectedImage(res.assets[0].uri);
        } },
      { text: 'Cancel', style: 'cancel' },
    ]);

  /* ---------- name flow ---------- */
  const openNameModal = () => { setNewName(admin.name); setNameModal(true); };
  const saveName = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    try {
      setSavingName(true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/user/profile`, { name: newName.trim() },
        { headers: { Authorization: `Bearer ${token}` } });
      setAdmin((p) => ({ ...p, name: newName.trim() }));
      setNameModal(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not update name');
    } finally { setSavingName(false); }
  };

  /* ---------- email flow ---------- */
  const openEmailModal = () => { setNewEmail(admin.email); setEmailStage('edit'); setCode(''); setEmailModal(true); };

  // STEP 1: request code
  const sendVerificationCode = async () => {
    if (!newEmail.trim()) { Alert.alert('Error', 'Email cannot be empty'); return; }
    try {
      setEmailBusy(true);
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/auth/request-email-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      setEmailStage('verify');
    } catch { Alert.alert('Error', 'Could not send verification code'); }
    finally { setEmailBusy(false); }
  };

  // STEP 2: verify & save
  const saveVerifiedEmail = async () => {
    if (!code.trim()) { Alert.alert('Error', 'Enter the verification code'); return; }
    try {
      setEmailBusy(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail: newEmail.trim(), code: code.trim() }),
      });
      const json = await res.json();
      if (res.status !== 200) throw new Error(json.message);
      setAdmin((p) => ({ ...p, email: json.email }));
      setEmailModal(false);
      Alert.alert('Success', 'Email updated & verified');
    } catch (e) {
      Alert.alert('Error', e.message || 'Verification failed');
    } finally { setEmailBusy(false); }
  };

  /* ---------- password flow ---------- */
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Error', 'All fields are required'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'New password and confirmation do not match'); return; }
    try {
      setChangingPw(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/auth/change-password`,
        { currentPassword: currentPw, newPassword: newPw },
        { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert('Success', 'Password updated.\nYou will be logged out.', [
        { text: 'OK', onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } },
      ], { cancelable: false });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message ?? 'Server error');
    } finally {
      setChangingPw(false);
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    }
  };

  /* ---------- render ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.headerTitle}>Admin Account</Text>

        {/* profile card */}
        <View style={styles.profileBox}>
          <TouchableOpacity onPress={chooseImageSource} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              {uploading
                ? <ActivityIndicator size="small" color={colors.tint}/>
                : <Image source={admin.profilePhotoUrl
                    ? { uri: admin.profilePhotoUrl }
                    : require('../assets/avatar-placeholder.png')}
                    style={styles.avatar}/>}
              <View style={styles.plusBadge}><Ionicons name="add" size={16} color="#fff"/></View>
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.nameText}>{admin.name}</Text>
            <Text style={styles.emailText}>{admin.email}</Text>
          </View>
        </View>

        {/* options */}
        <Text style={styles.sectionTitle}>Account Details</Text>
        {[
          { label: 'Edit Name',   icon: 'person-outline', action: openNameModal },
          { label: 'Edit Email',  icon: 'mail-outline',   action: openEmailModal },
          { label: 'Change Password', icon: 'lock-closed-outline', action: () => setPwModal(true) },
        ].map(i => (
          <TouchableOpacity key={i.label} style={styles.detailItem} onPress={i.action}>
            <View style={styles.detailLeft}><Ionicons name={i.icon} size={20} color={colors.tint}/>
              <Text style={styles.detailLabel}>{i.label}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary}/>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ----- Name modal ----- */}
      <Modal visible={nameModal} animationType="slide" transparent onRequestClose={() => setNameModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Update Name</Text>
          <TextInput
            value={newName} onChangeText={setNewName} placeholder="Full name"
            style={styles.emailInput} placeholderTextColor="#999"/>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.btn,{backgroundColor:'#eee'}]}
              onPress={()=>setNameModal(false)} disabled={savingName}>
              <Text style={styles.btnCancel}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn,{backgroundColor:colors.tint}]}
              onPress={saveName} disabled={savingName}>
              {savingName ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnOK}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* ----- Email modal ----- */}
      <Modal visible={emailModal} animationType="slide" transparent onRequestClose={() => setEmailModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {emailStage === 'edit' ? 'Update Email' : 'Enter Verification Code'}
          </Text>

          {emailStage === 'edit' && (
            <TextInput
              value={newEmail} onChangeText={setNewEmail} placeholder="New email"
              keyboardType="email-address" autoCapitalize="none"
              style={[styles.emailInput,{backgroundColor:darkMode?colors.card:'#F3F4F6'}]}
              placeholderTextColor={darkMode?colors.textSecondary:'#999'}/>
          )}

          {emailStage === 'verify' && (
            <TextInput
              value={code} onChangeText={setCode} placeholder="6-digit code"
              keyboardType="number-pad" style={styles.emailInput}/>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.btn,{backgroundColor:'#eee'}]}
              onPress={()=>setEmailModal(false)} disabled={emailBusy}>
              <Text style={styles.btnCancel}>Cancel</Text></TouchableOpacity>

            <TouchableOpacity style={[styles.btn,{backgroundColor:colors.tint}]}
              onPress={emailStage==='edit' ? sendVerificationCode : saveVerifiedEmail}
              disabled={emailBusy}>
              {emailBusy
                ? <ActivityIndicator color="#fff"/>
                : <Text style={styles.btnOK}>{emailStage==='edit' ? 'Verify' : 'Save'}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* ----- Password modal ----- */}
      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={()=>setPwModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Change Password</Text>
          {['Current Password','New Password','Confirm New Password'].map((ph,i)=>(
            <TextInput key={ph} placeholder={ph} placeholderTextColor="#bbb" secureTextEntry
              style={styles.emailInput}
              value={[currentPw,newPw,confirmPw][i]}
              onChangeText={[setCurrentPw,setNewPw,setConfirmPw][i]}/>))}
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.btn,{backgroundColor:'#eee'}]}
              onPress={()=>setPwModal(false)} disabled={changingPw}>
              <Text style={styles.btnCancel}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn,{backgroundColor:colors.tint}]}
              onPress={handleChangePassword} disabled={changingPw}>
              {changingPw ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnOK}>Change</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const getStyles = (c,dark)=>StyleSheet.create({
  safe:{flex:1,backgroundColor:dark?c.bg:'#F9FBF9'},container:{padding:20},
  headerTitle:{fontSize:24,fontWeight:'700',color:dark?c.text:'#111827',marginBottom:20},
  profileBox:{flexDirection:'row',alignItems:'center',
    backgroundColor:dark?c.card:'#DFFFE0',padding:16,borderRadius:16,marginBottom:30},
  avatarWrapper:{position:'relative',marginRight:16},
  avatar:{width:64,height:64,borderRadius:32,backgroundColor:'#E0E0E0'},
  plusBadge:{position:'absolute',bottom:-2,right:-2,backgroundColor:c.tint,borderRadius:10,padding:2},
  nameText:{fontSize:18,fontWeight:'600',color:c.text},
  emailText:{fontSize:14,color:c.text},
  sectionTitle:{fontSize:16,fontWeight:'600',marginBottom:12,color:c.text},
  detailItem:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    backgroundColor:dark?c.card:'#fff',padding:14,borderRadius:12,marginBottom:12,elevation:1},
  detailLeft:{flexDirection:'row',alignItems:'center'},
  detailLabel:{marginLeft:12,fontSize:15,fontWeight:'500',color:c.text},
  /* modals */
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},
  modalCard:{width:'80%',padding:20,backgroundColor:dark?c.card:'#fff',borderRadius:16},
  modalTitle:{fontSize:18,fontWeight:'600',color:c.text,marginBottom:12,textAlign:'center'},
  emailInput:{borderRadius:12,borderWidth:1,borderColor:'#E5E7EB',padding:12,fontSize:15,marginBottom:14,
    color:dark?c.text:'#111827',backgroundColor:dark?c.card:'#F3F4F6'},
  modalActions:{flexDirection:'row',justifyContent:'flex-end'},
  btn:{paddingVertical:10,paddingHorizontal:20,borderRadius:8,marginLeft:12},
  btnCancel:{color:'#333',fontWeight:'600'},btnOK:{color:'#fff',fontWeight:'600'},
});
