// screens/EditAdminScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function EditAdminScreen({ route, navigation }) {
  const { admin } = route.params;
  const roles = [
    { value: 'admin_full', label: 'Full Admin', description: 'Complete system access' },
    { value: 'challenge_admin', label: 'Challenge Admin', description: 'Manages challenges' },
    { value: 'guide_admin', label: 'Guide Admin', description: 'Manages guides' },
    { value: 'recycling_admin', label: 'Recycling Admin', description: 'Manages recycling content' },
  ];

  const [form, setForm] = useState({ name: admin.name, email: admin.email, role: admin.role });
  const [loading, setLoading] = useState(false);
  const [roleDropdownVisible, setRoleDropdownVisible] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/user/admins/${admin._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Admin updated');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (value) => {
    setForm(f => ({ ...f, role: value }));
    setRoleDropdownVisible(false);
  };

  const getRoleDisplayName = (value) => {
    const r = roles.find(r => r.value === value);
    return r ? r.label : value;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Admin</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={name => setForm(f => ({ ...f, name }))}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={email => setForm(f => ({ ...f, email }))}
        />

        <Text style={styles.label}>Admin Role</Text>
        <TouchableOpacity
          style={styles.roleSelector}
          onPress={() => setRoleDropdownVisible(true)}
        >
          <Text style={styles.roleSelectorText}>
            {getRoleDisplayName(form.role)}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Role Selection Modal */}
      <Modal
        visible={roleDropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleDropdownVisible(false)}
      >
        <View style={styles.roleModalOverlay}>
          <TouchableOpacity
            style={styles.roleModalBackdrop}
            activeOpacity={1}
            onPress={() => setRoleDropdownVisible(false)}
          />
          <View style={styles.roleModalContent}>
            <View style={styles.roleModalHeader}>
              <Text style={styles.roleModalTitle}>Select Admin Role</Text>
              <TouchableOpacity
                style={styles.roleModalCloseIcon}
                onPress={() => setRoleDropdownVisible(false)}
              >
                <Text style={styles.roleModalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.roleList} showsVerticalScrollIndicator={false}>
              {roles.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleOption,
                    form.role === r.value && styles.selectedRoleOption
                  ]}
                  onPress={() => handleRoleSelect(r.value)}
                >
                  <View style={styles.roleOptionContent}>
                    <Text style={[
                      styles.roleOptionTitle,
                      form.role === r.value && styles.selectedRoleText
                    ]}>
                      {r.label}
                    </Text>
                    <Text style={[
                      styles.roleOptionDescription,
                      form.role === r.value && styles.selectedRoleDescription
                    ]}>
                      {r.description}
                    </Text>
                  </View>
                  {form.role === r.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginTop: 4 },
  roleSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginTop: 4 },
  roleSelectorText: { fontSize: 16 },
  dropdownArrow: { fontSize: 12 },
  saveBtn: { backgroundColor: '#10B981', marginTop: 30, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: '600', fontSize: 16 },

  // Role Modal Styles
  roleModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  roleModalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  roleModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  roleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  roleModalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  roleModalCloseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  roleModalCloseIconText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  roleList: { maxHeight: 400, paddingBottom: 20 },
  roleOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  selectedRoleOption: { backgroundColor: '#EEF2FF' },
  roleOptionContent: { flex: 1 },
  roleOptionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  selectedRoleText: { color: '#6366F1' },
  roleOptionDescription: { fontSize: 13, color: '#6B7280' },
  selectedRoleDescription: { color: '#6366F1' },
  checkmark: { fontSize: 18, color: '#6366F1', fontWeight: '700', marginLeft: 12 },
});
