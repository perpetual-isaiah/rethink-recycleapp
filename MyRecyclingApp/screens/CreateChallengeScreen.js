import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config';
import { useTheme }    from '../context/ThemeContext';

export default function CreateChallengeScreen() {
  const navigation         = useNavigation();
  const { colors, darkMode } = useTheme();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [days,        setDays]        = useState('7');
  const [why,         setWhy]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const submit = async () => {
    if (!title || !description || !days) {
      Alert.alert('Required', 'Title, description & duration are required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const start = new Date();
      const end   = new Date();
      end.setDate(start.getDate() + parseInt(days, 10) - 1);

      await axios.post(
        `${API_BASE_URL}/api/challenges`,
        {
          title,
          description,
          startDate: start,
          endDate:   end,
          whyParticipate: why,
        },
        { headers }
      );

      Alert.alert('Created', 'Your challenge has been submitted!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error(err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Could not create challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- styles with theme ----- */
  const styles = getStyles(colors, darkMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? colors.bg : '#F9FAFB' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Create Challenge</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="30-Day Plastic-Free"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="What is this challenge about?"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Duration (days) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={days}
            onChangeText={setDays}
            placeholder="7"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Why participate? (optional)</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            multiline
            value={why}
            onChangeText={setWhy}
            placeholder="Motivation / expected impact"
            placeholderTextColor={colors.textSecondary}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitTxt}>Create</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- dynamic StyleSheet ---------- */
const getStyles = (c, dark) => StyleSheet.create({
  container:   { padding: 20 },
  header:      { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 20 },

  label:       { fontSize: 14, color: c.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: dark ? c.card : '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderWidth: 1,
    borderColor: dark ? c.separator : '#D1D5DB',
    color: c.text,
    marginBottom: 16,
  },

  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  submitTxt: { color: '#fff', fontWeight: '700', marginLeft: 6 },
});
