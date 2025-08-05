// screens/CommunityChatsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';  // ← imported

export default function CommunityChatsScreen() {
  const { colors } = useTheme();                      // ← grab palette
  const styles = getStyles(colors);                   // ← dynamic styles

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedChallenges, setJoinedChallenges] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  const fetchJoined = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `${API_BASE_URL}/api/user-challenges`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      let filtered = data.filter(item => item.challengeId && item.status === 'active');
      filtered.sort((a, b) => {
        const dateA =
          a.lastMessage?.timestamp ||
          a.challengeId.updatedAt ||
          a.challengeId.createdAt ||
          0;
        const dateB =
          b.lastMessage?.timestamp ||
          b.challengeId.updatedAt ||
          b.challengeId.createdAt ||
          0;
        return new Date(dateB) - new Date(dateA);
      });
      setJoinedChallenges(filtered);
    } catch {
      setJoinedChallenges([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJoined();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJoined();
  }, []);

  const filteredChallenges = joinedChallenges.filter(item =>
    item.challengeId.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }) => {
    if (!item.challengeId) return null;
    const { title, description } = item.challengeId;
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (unread > 0) {
            setJoinedChallenges(prev =>
              prev.map(c =>
                c._id === item._id ? { ...c, unreadCount: 0 } : c
              )
            );
            AsyncStorage.getItem('token').then(token =>
              axios
                .patch(
                  `${API_BASE_URL}/api/user-challenges/${item._id}/mark-read`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                .catch(() => {})
            );
          }
          navigation.navigate('ChallengeChatScreen', {
            challengeId: item.challengeId._id,
            challengeTitle: title,
            userChallengeId: item._id,
          });
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {title?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Untitled'}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {description || 'No description'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unread}</Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={22}
          color={colors.textSecondary}
          style={{ marginLeft: 10 }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Community Chats</Text>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={{ marginLeft: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by challenge name..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={filteredChallenges}
          keyExtractor={item =>
            item.challengeId?._id?.toString() ??
            item._id?.toString() ??
            Math.random().toString()
          }
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          contentContainerStyle={[
            styles.list,
            filteredChallenges.length === 0
              ? { flex: 1, justifyContent: 'center' }
              : null,
          ]}
          ListEmptyComponent={
            <View style={styles.emptySearchWrap}>
              <Ionicons
                name="chatbubbles-outline"
                size={46}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {searchText
                  ? 'No matching chats found.'
                  : "You haven't joined any community challenges yet."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: '700',
      marginHorizontal: 24,
      marginBottom: 8,
      color: colors.text,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.separator,
      borderRadius: 18,
      marginHorizontal: 18,
      marginBottom: 10,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      fontSize: 16,
      color: colors.text,
      backgroundColor: 'transparent',
    },
    list: {
      paddingBottom: 24,
      flexGrow: 1,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      padding: 14,
      shadowColor: colors.text,
      shadowOpacity: 0.07,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    avatarText: {
      color: colors.card,
      fontWeight: 'bold',
      fontSize: 20,
      letterSpacing: 1,
    },
    cardContent: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      opacity: 0.96,
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 12,
      backgroundColor: colors.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginLeft: 6,
    },
    unreadBadgeText: {
      color: colors.card,
      fontWeight: 'bold',
      fontSize: 12,
      paddingHorizontal: 2,
    },
    emptySearchWrap: {
      flex: 1,
      alignItems: 'center',
      marginTop: 60,
      marginHorizontal: 28,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 14,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 30,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
  });
