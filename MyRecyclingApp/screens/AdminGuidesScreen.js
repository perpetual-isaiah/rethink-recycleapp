// screens/AdminGuidesScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function AdminGuidesScreen() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editGuide, setEditGuide] = useState(null); // The guide being edited
  const [editFields, setEditFields] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/guides`);
      setGuides(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load guides.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchGuides(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGuides();
  };

  const handleEdit = (guide) => {
    setEditGuide(guide);
    setEditFields({
      label: guide.label || '',
      description: guide.description || '',
      icon: guide.icon || '',
      containerTag: guide.containerTag || '',
      dos: Array.isArray(guide.dos) ? guide.dos.join('\n') : '',
      donts: Array.isArray(guide.donts) ? guide.donts.join('\n') : '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        label: editFields.label,
        description: editFields.description,
        icon: editFields.icon,
        containerTag: editFields.containerTag,
        dos: editFields.dos ? editFields.dos.split('\n').map((d) => d.trim()).filter(Boolean) : [],
        donts: editFields.donts ? editFields.donts.split('\n').map((d) => d.trim()).filter(Boolean) : [],
      };
      await axios.patch(`${API_BASE_URL}/api/guides/${editGuide.key}`, payload);
      setModalVisible(false);
      setEditGuide(null);
      setEditFields({});
      fetchGuides();
      Alert.alert('Success', 'Guide updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update guide');
    } finally {
      setSaving(false);
    }
  };

  const renderGuide = ({ item }) => (
    <View style={styles.guideCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.guideLabel}>{item.label}</Text>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      <Text style={styles.guideDesc}>{item.description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        <Text style={styles.guideMeta}>Icon: {item.icon || '—'}</Text>
        <Text style={styles.guideMeta}>Container: {item.containerTag || '—'}</Text>
      </View>
      {(item.dos?.length > 0 || item.donts?.length > 0) && (
        <View style={{ marginTop: 6 }}>
          {item.dos?.length > 0 && (
            <Text style={styles.guideDoDont}><Text style={{ color: '#22c55e', fontWeight: 'bold' }}>Do:</Text> {item.dos.join(', ')}</Text>
          )}
          {item.donts?.length > 0 && (
            <Text style={styles.guideDoDont}><Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Don't:</Text> {item.donts.join(', ')}</Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Ionicons name="book-outline" size={26} color="#4CAF50" style={{ marginRight: 10 }} />
        <Text style={styles.header}>Guides Management</Text>
      </View>
      <FlatList
        data={guides}
        keyExtractor={g => g.key || g._id}
        renderItem={renderGuide}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
        ListEmptyComponent={!loading && (
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ color: '#aaa' }}>No guides found.</Text>
          </View>
        )}
      />
      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Edit Guide</Text>
            <Text style={styles.inputLabel}>Title / Label</Text>
            <TextInput
              style={styles.input}
              value={editFields.label}
              onChangeText={v => setEditFields(f => ({ ...f, label: v }))}
            />
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 70 }]}
              value={editFields.description}
              onChangeText={v => setEditFields(f => ({ ...f, description: v }))}
              multiline
            />
            <Text style={styles.inputLabel}>Icon</Text>
            <TextInput
              style={styles.input}
              value={editFields.icon}
              onChangeText={v => setEditFields(f => ({ ...f, icon: v }))}
            />
            <Text style={styles.inputLabel}>Container Tag</Text>
            <TextInput
              style={styles.input}
              value={editFields.containerTag}
              onChangeText={v => setEditFields(f => ({ ...f, containerTag: v }))}
            />
            <Text style={styles.inputLabel}>Do's (one per line)</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={editFields.dos}
              onChangeText={v => setEditFields(f => ({ ...f, dos: v }))}
              multiline
            />
            <Text style={styles.inputLabel}>Don'ts (one per line)</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={editFields.donts}
              onChangeText={v => setEditFields(f => ({ ...f, donts: v }))}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#eee' }]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={{ color: '#333', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#4CAF50' }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F8' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginLeft: 20, marginBottom: 6 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  list: { padding: 18, paddingTop: 10, paddingBottom: 36 },
  guideCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  guideLabel: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  guideDesc: { fontSize: 14, color: '#444', marginBottom: 6 },
  guideMeta: { fontSize: 12, color: '#666', marginRight: 16 },
  guideDoDont: { fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,30,30,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '93%',
    maxWidth: 400, minHeight: 300, shadowColor: '#222', shadowOpacity: 0.16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 14, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginTop: 10, marginBottom: 3 },
  input: {
    backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 10,
    fontSize: 15, color: '#222', marginBottom: 6, borderWidth: 1, borderColor: '#e0e0e0',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
});
