import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

export default function ChallengeDetailsScreen({ route, navigation }) {
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChallengeDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/challenges/${challengeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenge(response.data);
    } catch (error) {
      console.error('Error loading challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!challenge) {
    return null;
  }

  const startDate = new Date(challenge.startDate).toLocaleDateString();
  const endDate = new Date(challenge.endDate).toLocaleDateString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.description}>{challenge.description}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Start Date:</Text>
          <Text style={styles.value}>{startDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>End Date:</Text>
          <Text style={styles.value}>{endDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Participate?</Text>
          <Text style={styles.sectionText}>
            {challenge.whyParticipate?.trim() || 'No details provided.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors, darkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: darkMode ? '#000' : colors.background,
    },
    container: {
      padding: 20,
      paddingBottom: 40,
      backgroundColor: darkMode ? '#000' : colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: darkMode ? '#000' : colors.background,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    value: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    sectionText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
