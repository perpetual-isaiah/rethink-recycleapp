// screens/AdminRecyclingPointsScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function AdminRecyclingPointsScreen() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    id: null,
    name: '',
    address: '',
    city: '',
    region: '',
    lat: '',
    lng: '',
    materials: '',
    tags: ''
  });

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const { data } = await axios.get(`${API_BASE_URL}/api/recycling-points`, { headers });
      setPoints(data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter points based on search query
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return points;
    
    const query = searchQuery.toLowerCase();
    return points.filter(point => {
      const name = (point.name || '').toLowerCase();
      const address = (point.address || '').toLowerCase();
      const city = (point.city || '').toLowerCase();
      const region = (point.region || '').toLowerCase();
      const tags = (point.tags || []).join(' ').toLowerCase();
      
      return name.includes(query) ||
             address.includes(query) ||
             city.includes(query) ||
             region.includes(query) ||
             tags.includes(query);
    });
  }, [points, searchQuery]);

  useEffect(() => {
    fetchPoints();
  }, []);

  const savePoint = async () => {
    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      region: form.region,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      materials: form.materials.split(',').map(m => m.trim()),
      tags: form.tags.split(',').map(t => t.trim()),
    };
    try {
      const headers = await authHeaders();
      if (form.id) {
        await axios.put(`${API_BASE_URL}/api/recycling-points/${form.id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/api/recycling-points`, payload, { headers });
      }
      setModalVisible(false);
      fetchPoints();
    } catch (e) {
      Alert.alert('Save Failed', e.response?.data?.message || e.message);
    }
  };

  const deletePoint = async id => {
    Alert.alert('Delete?', 'Confirm removing this point.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const headers = await authHeaders();
            await axios.delete(`${API_BASE_URL}/api/recycling-points/${id}`, { headers });
            fetchPoints();
          } catch (e) {
            Alert.alert('Delete Failed', e.response?.data?.message || e.message);
          }
        }
      }
    ]);
  };

  const openModal = point => {
    if (point) {
      setForm({
        id: point._id,
        name: point.name,
        address: point.address || '',
        city: point.city || '',
        region: point.region || '',
        lat: String(point.lat),
        lng: String(point.lng),
        materials: (point.materials || []).join(', '),
        tags: (point.tags || []).join(', ')
      });
    } else {
      setForm({ id: null, name: '', address: '', city: '', region: '', lat: '', lng: '', materials: '', tags: '' });
    }
    setModalVisible(true);
  };

  const renderFormField = field => {
    const label =
      field === 'lat' ? 'Latitude' :
      field === 'lng' ? 'Longitude' :
      field === 'materials' ? 'Materials (comma separated)' :
      field === 'tags' ? 'Tags (comma separated)' :
      field === 'address' ? 'Address' :
      field.charAt(0).toUpperCase() + field.slice(1);

    const isTextArea = ['address','materials','tags'].includes(field);
    const isNumeric = ['lat','lng'].includes(field);

    return (
      <View key={field} style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          placeholder={label}
          placeholderTextColor="#999"
          value={form[field]}
          onChangeText={text => setForm({ ...form, [field]: text })}
          style={[styles.input, isTextArea && styles.textArea]}
          multiline={isTextArea}
          textAlignVertical={isTextArea ? 'top' : 'center'}
          keyboardType={isNumeric ? 'numeric' : 'default'}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Recycling Points</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal(null)}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, address, city, region, or tags..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results count */}
      {searchQuery.trim() && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredPoints.length} result{filteredPoints.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={filteredPoints}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPoints} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'No recycling points match your search' : 'No recycling points found'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.info}>{item.address}, {item.city}</Text>
              <Text style={styles.info}>{item.region}</Text>
              {item.tags && item.tags.length > 0 && (
                <Text style={styles.tags}>Tags: {item.tags.join(', ')}</Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openModal(item)} style={styles.iconBtn}>
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deletePoint(item._id)} style={styles.iconBtn}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
          style={styles.modalKeyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{form.id ? 'Edit Point' : 'New Point'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalContent} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {['name','address','city','region','lat','lng','materials','tags'].map(renderFormField)}
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.saveBtn} onPress={savePoint}>
                    <Text style={styles.saveText}>{form.id ? 'Update' : 'Create'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 5, elevation: 3
  },
  title: { fontSize: 20, fontWeight: '700' },
  addBtn: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 6 },
  addText: { color: '#fff', fontWeight: '600' },
  
  // Search styles
  searchContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  clearText: {
    fontSize: 16,
    color: '#999',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', shadowColor: '#000',
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  info: { fontSize: 14, color: 'black' },
  tags: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // Modal styles
  modalKeyboardContainer: {
    flex: 1,
  },
  modalSafeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  modalContainer: { 
    flex: 1 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff'
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: { 
    fontSize: 16, 
    color: '#666' 
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: { 
    padding: 16,
    paddingBottom: 120, // Extra padding for keyboard space
    flexGrow: 1
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8,
    padding: 12, 
    backgroundColor: '#FBFBFB',
    fontSize: 16,
    minHeight: 44
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  saveBtn: { 
    backgroundColor: '#388E3C', 
    padding: 16, 
    borderRadius: 8,
    alignItems: 'center', 
    marginBottom: 12 
  },
  saveText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelText: { 
    color: '#666', 
    fontSize: 16,
    fontWeight: '500'
  }
});