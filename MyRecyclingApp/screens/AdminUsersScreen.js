// screens/AdminUsersScreen.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function AdminUsersScreen({ navigation }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleDropdownVisible, setRoleDropdownVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin_full'
  });

  // Define available roles
  const roles = [
    { value: 'admin_full', label: 'Full Admin', description: 'Complete system access' },
    { value: 'challenge_admin', label: 'Challenge Admin', description: 'Manages challenges' },
    { value: 'guide_admin', label: 'Guide Admin', description: 'Manages guides' },
    { value: 'recycling_admin', label: 'Recycling Admin', description: 'Manages recycling content' },
  ];

  // Fetch list
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `${API_BASE_URL}/api/user/admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdmins(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Create new admin
  const handleCreate = async () => {
    const { name, email, password, role } = form;
    if (!name || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/user/admins`,
        { name, email, password, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Admin created successfully');
      setModalVisible(false);
      setForm({ name: '', email: '', password: '', role: 'admin_full' });
      fetchAdmins();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  // Edit (stub: navigate to an edit screen)
  const handleEdit = (admin) => {
    navigation.navigate('EditAdmin', { admin });
  };

  // Delete
  const handleDelete = (admin) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${admin.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(
                `${API_BASE_URL}/api/user/admins/${admin._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              fetchAdmins();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message);
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin_full':
        return { backgroundColor: '#E8F5E8', color: '#2E7D32' };
      case 'challenge_admin':
        return { backgroundColor: '#E3F2FD', color: '#1565C0' };
      case 'recycling_admin':
        return { backgroundColor: '#FFF3E0', color: '#F57C00' };
      case 'guide_admin':
        return { backgroundColor: '#F3E5F5', color: '#7B1FA2' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#666' };
    }
  };

  const getRoleDisplayName = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const handleRoleSelect = (roleValue) => {
    console.log('Role selected:', roleValue);
    setForm(f => ({ ...f, role: roleValue }));
    setRoleDropdownVisible(false);
  };

  const renderItem = ({ item, index }) => {
    const roleBadgeStyle = getRoleBadgeStyle(item.role);
    
    return (
      <View style={[styles.card, { marginTop: index === 0 ? 0 : 12 }]}>
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleBadgeStyle.backgroundColor }]}>
              <Text style={[styles.roleText, { color: roleBadgeStyle.color }]}>
                {getRoleDisplayName(item.role)}
              </Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => handleEdit(item)} 
              style={styles.editBtn}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(item)} 
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading admins...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Management</Text>
          <Text style={styles.subtitle}>
            {admins.length} admin{admins.length !== 1 ? 's' : ''} registered
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ New Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Admin List */}
      <FlatList
        data={admins}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No admins found</Text>
            <Text style={styles.emptySubtext}>Create your first admin to get started</Text>
          </View>
        }
      />

      {/* Modal for creating new admin */}
      <Modal 
        visible={modalVisible} 
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Admin</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                value={form.email}
                onChangeText={v => setForm(f => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Enter secure password"
                placeholderTextColor="#9CA3AF"
                value={form.password}
                onChangeText={v => setForm(f => ({ ...f, password: v }))}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Role</Text>
              <TouchableOpacity 
                style={styles.roleSelector} 
                onPress={() => {
                  console.log('Role selector pressed');
                  setRoleDropdownVisible(true);
                }}
              >
                <Text style={styles.roleSelectorText}>
                  {getRoleDisplayName(form.role)}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              
              {/* Inline dropdown alternative */}
              {roleDropdownVisible && (
                <View style={styles.inlineDropdown}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.inlineRoleOption,
                        form.role === role.value && styles.selectedInlineOption
                      ]}
                      onPress={() => handleRoleSelect(role.value)}
                    >
                      <Text style={[
                        styles.inlineRoleText,
                        form.role === role.value && styles.selectedInlineText
                      ]}>
                        {role.label}
                      </Text>
                      {form.role === role.value && (
                        <Text style={styles.inlineCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Role Selection Modal */}
      <Modal 
        visible={roleDropdownVisible} 
        transparent={true}
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
                onPress={() => setRoleDropdownVisible(false)}
                style={styles.roleModalCloseIcon}
              >
                <Text style={styles.roleModalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.roleList} showsVerticalScrollIndicator={false}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    form.role === role.value && styles.selectedRoleOption
                  ]}
                  onPress={() => handleRoleSelect(role.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleOptionContent}>
                    <Text style={[
                      styles.roleOptionTitle,
                      form.role === role.value && styles.selectedRoleText
                    ]}>
                      {role.label}
                    </Text>
                    <Text style={[
                      styles.roleOptionDescription,
                      form.role === role.value && styles.selectedRoleDescription
                    ]}>
                      {role.description}
                    </Text>
                  </View>
                  {form.role === role.value && (
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
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // List Styles
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Action Buttons
  actions: {
    flexDirection: 'column',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  editText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Modal Styles
  modalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Form Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  
  // Role Selector Styles
  roleSelector: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },

  // Inline Dropdown Styles (Alternative approach)
  inlineDropdown: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  inlineRoleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedInlineOption: {
    backgroundColor: '#EEF2FF',
  },
  inlineRoleText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedInlineText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  inlineCheckmark: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '700',
  },

  // Role Modal Styles
  roleModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  roleModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  roleModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  roleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleModalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleModalCloseIconText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  roleList: {
    maxHeight: 400,
    paddingBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedRoleOption: {
    backgroundColor: '#EEF2FF',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedRoleText: {
    color: '#6366F1',
  },
  roleOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedRoleDescription: {
    color: '#6366F1',
  },
  checkmark: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '700',
    marginLeft: 12,
  },

  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 54,
    color: '#1F2937',
  },

  // Button Styles
  buttonGroup: {
    marginTop: 32,
  },
  createBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});