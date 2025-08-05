import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function MyChallengesDetailsScreen() {
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);
  const { params } = useRoute();
  const navigation = useNavigation();
  const { userChallengeId } = params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [updating, setUpdating] = useState({});
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChallenge = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(
        `${API_BASE_URL}/api/user-challenges/${userChallengeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenge(res.data.challengeId);
      setProgress(res.data.progress || {});
      setCurrentStreak(res.data.currentStreak || 0);
      setLongestStreak(res.data.longestStreak || 0);
    } catch (err) {
      console.error('Error loading challenge details:', err.message);
      Alert.alert('Error', 'Failed to load challenge details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userChallengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenge();
  }, [fetchChallenge]);

  const handleToggle = async (dayKey, value) => {
    if (updating[dayKey]) return;
    setUpdating(prev => ({ ...prev, [dayKey]: true }));
    const previousValue = progress[dayKey];
    setProgress(prev => ({ ...prev, [dayKey]: value }));

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/user-challenges/${userChallengeId}/progress`,
        { taskKey: dayKey, completed: value },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.status !== 200) throw new Error('Update failed');
      // Refetch challenge to get updated streak and progress from backend
      await fetchChallenge();
    } catch (err) {
      console.error('Toggle error:', err.response?.data || err.message);
      setProgress(prev => ({ ...prev, [dayKey]: previousValue }));
      if (err.code === 'ECONNABORTED') {
        Alert.alert('Timeout', 'Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again.');
      } else if (err.response?.status >= 500) {
        Alert.alert('Server Error', 'Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to update progress.');
      }
    } finally {
      setUpdating(prev => ({ ...prev, [dayKey]: false }));
    }
  };

  const handleNumericInput = (dayKey) => {
    if (updating[dayKey]) return;
    setSelectedDay(dayKey);
    setInputValue(progress[dayKey]?.toString() || '');
    setShowInputModal(true);
  };

  const submitNumericInput = async () => {
    if (!selectedDay || inputValue.trim() === '') return;
    setSubmitting(true);
    const previousValue = progress[selectedDay];

    try {
      const token = await AsyncStorage.getItem('token');
      const numericValue = parseFloat(inputValue);
      if (isNaN(numericValue) || numericValue < 0) {
        Alert.alert('Invalid Input', 'Please enter a valid positive number');
        return;
      }
      setProgress(prev => ({ ...prev, [selectedDay]: numericValue }));
      const response = await axios.patch(
        `${API_BASE_URL}/api/user-challenges/${userChallengeId}/progress`,
        { taskKey: selectedDay, completed: numericValue },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.status === 200) {
        setShowInputModal(false);
        setInputValue('');
        setSelectedDay(null);
        await fetchChallenge();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Numeric update error:', err.message);
      setProgress(prev => ({ ...prev, [selectedDay]: previousValue }));
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !challenge) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const dayCount = Math.ceil(
    (new Date(challenge.endDate) - new Date(challenge.startDate)) / 86400000
  ) + 1;
  const days = Array.from({ length: dayCount }, (_, i) => `day${i + 1}`);
  const completedDays = days.filter(d => progress[d]).length;
  const completionRate = Math.round((completedDays / dayCount) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <StatCard number={completedDays} label="Completed" colors={colors} />
        <StatCard number={`${completionRate}%`} label="Success Rate" colors={colors} />
        <StatCard number={currentStreak} label="Current Streak" colors={colors} />
        <StatCard number={longestStreak} label="Longest Streak" colors={colors} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedDays} of {dayCount} days completed</Text>
      </View>

      {challenge.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{challenge.description}</Text>
        </View>
      ) : null}

      <FlatList
        data={days}
        keyExtractor={item => item}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => {
          const isCompleted = Boolean(progress[item]);
          const isToday = isCurrentDay(challenge.startDate, index);
          const isUpdating = updating[item];

          // Allow input for today and past days
          const canEdit = isPastOrToday(challenge.startDate, index);

          return (
            <View style={[
              styles.dayRow,
              isCompleted && styles.completedRow,
              isToday && styles.todayRow,
              isUpdating && styles.updatingRow,
            ]}>
              <View style={styles.dayInfo}>
                <Text style={[
                  styles.dayText,
                  isCompleted && styles.completedText,
                  isToday && styles.todayText
                ]}>Day {index + 1}</Text>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
              </View>
              <View style={styles.dayActions}>
                {challenge.type === 'numeric' ? (
                  <TouchableOpacity
                    style={[styles.numericButton, (isUpdating || !canEdit) && styles.disabledButton]}
                    onPress={() => { if (canEdit) handleNumericInput(item); }}
                    disabled={isUpdating || !canEdit}
                  >
                    <Text style={styles.numericButtonText}>{progress[item] || 0}</Text>
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <Switch
                    value={isCompleted}
                    onValueChange={val => {
                      if (canEdit) handleToggle(item, val);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={isCompleted ? colors.card : colors.borderLight}
                    disabled={isUpdating || !canEdit}
                  />
                )}
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                ) : (
                  isCompleted && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </View>
              {/* Optional info message for marking past days */}
              {!isToday && canEdit && (
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                  Marking previous days won&apos;t affect your streak
                </Text>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showInputModal} transparent animationType="slide" onRequestClose={() => setShowInputModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Progress for {selectedDay?.replace('day', 'Day ')}</Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter value"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowInputModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={submitNumericInput} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={colors.card} /> : <Text style={styles.submitButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const StatCard = ({ number, label, colors }) => (
  <View style={statStyles.container}>
    <Text style={[statStyles.number, { color: colors.primary }]}>{number}</Text>
    <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  number: { fontSize: 24, fontWeight: 'bold' },
  label: { fontSize: 12, marginTop: 4 },
});

function isCurrentDay(startDate, dayIndex) {
  const start = new Date(startDate);
  const current = new Date(start.getTime() + dayIndex * 86400000);
  return current.toDateString() === new Date().toDateString();
}

function isPastOrToday(startDate, dayIndex) {
  const start = new Date(startDate);
  const dayDate = new Date(start.getTime() + dayIndex * 86400000);
  const today = new Date();
  dayDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return dayDate <= today;
}

const getStyles = (colors, darkMode) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: darkMode ? '#000' : colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkMode ? '#000' : colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: { padding: 8 },
    title: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginHorizontal: 16 },
    placeholder: { width: 40 },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.card,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: colors.shadow || '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
    },
    progressBarContainer: { paddingHorizontal: 16, marginBottom: 16 },
    progressBarBackground: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary },
    progressText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
    descriptionContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      elevation: 1,
      shadowColor: colors.shadow || '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
    },
    descriptionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 8,
      elevation: 1,
      shadowColor: colors.shadow || '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
    },
    completedRow: { borderLeftWidth: 4, borderLeftColor: colors.primary },
    todayRow: { borderWidth: 2, borderColor: colors.primary },
    updatingRow: { opacity: 0.7, backgroundColor: colors.mutedBackground || colors.borderLight },
    dayInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    dayText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
    completedText: { color: colors.primary, fontWeight: '600' },
    todayText: { color: colors.primary, fontWeight: '600' },
    todayBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
    todayBadgeText: { color: colors.card, fontSize: 10, fontWeight: '600' },
    dayActions: { flexDirection: 'row', alignItems: 'center' },
    numericButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.mutedBackground || colors.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 8,
    },
    numericButtonText: { fontSize: 14, color: colors.primary, fontWeight: '600', marginRight: 4 },
    disabledButton: { opacity: 0.6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { backgroundColor: darkMode ? '#333' : colors.card, borderRadius: 16, padding: 24, width: width * 0.85, maxWidth: 400 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 20 },
    modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, color: colors.text },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: colors.borderLight, marginRight: 8 },
    submitButton: { backgroundColor: colors.primary, marginLeft: 8 },
    cancelButtonText: { color: colors.textSecondary, fontWeight: '600' },
    submitButtonText: { color: colors.card, fontWeight: '600' },
  });
