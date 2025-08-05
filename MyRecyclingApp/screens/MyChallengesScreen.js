import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

export default function MyChallengesScreen() {
  const navigation = useNavigation();
  const { colors: c, darkMode } = useTheme();
  const styles = getStyles(c, darkMode);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedChallenges, setJoined] = useState([]);

  const fetchChallenges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `${API_BASE_URL}/api/user-challenges`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!Array.isArray(data)) throw new Error('Invalid response');
      const visible = data.filter((uc) => uc.status !== 'abandoned');
      setJoined(visible);
    } catch (err) {
      console.error('Fetch challenges failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges();
  }, []);

  const handleJoinChallenge = () => navigation.navigate('Challenges');
  const handleViewDetails = (id) => navigation.navigate('MyChallengesDetails', { userChallengeId: id });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={c.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {joinedChallenges.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>You haven't joined any challenges yet.</Text>
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinChallenge}>
            <Ionicons name="add-circle-outline" size={24} color={c.background} />
            <Text style={styles.joinButtonText}>Join a Challenge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={joinedChallenges}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.tint} />}
          renderItem={({ item }) => {
            const cdata = item.challengeId || {};
            return (
              <View style={styles.card}>
                <Text style={styles.title}>{cdata.title || 'Untitled'}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {cdata.description || 'No description available.'}
                </Text>
                <Text style={styles.dates}>
                  {cdata.startDate ? new Date(cdata.startDate).toLocaleDateString() : ''} -{' '}
                  {cdata.endDate ? new Date(cdata.endDate).toLocaleDateString() : ''}
                </Text>
                <TouchableOpacity style={styles.detailsButton} onPress={() => handleViewDetails(item._id)}>
                  <Text style={styles.detailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={20} color={c.tint} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleJoinChallenge}>
        <Ionicons name="add" size={32} color={c.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (c, dark) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: dark ? '#000' : c.surface },
    backButton: { flexDirection: 'row', alignItems: 'center', padding: 12, marginLeft: 4 },
    backText: { marginLeft: 6, fontSize: 16, color: c.text, fontWeight: '500' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyText: { textAlign: 'center', fontSize: 16, color: c.textSecondary, fontStyle: 'italic', marginBottom: 20 },
    joinButton: {
      flexDirection: 'row',
      backgroundColor: c.tint,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    joinButtonText: { color: c.background, marginLeft: 8, fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 100 },
    card: {
      backgroundColor: dark ? '#333' : c.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: dark ? 0.3 : 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 2,
    },
    title: { fontSize: 17, fontWeight: '600', color: c.text, marginBottom: 6 },
    description: { fontSize: 14, color: c.textSecondary, marginBottom: 8 },
    dates: { fontSize: 12, color: c.textSecondary },
    detailsButton: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
    detailsButtonText: { color: c.tint, fontWeight: '600', marginRight: 4 },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      backgroundColor: c.tint,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 6,
    },
  });
