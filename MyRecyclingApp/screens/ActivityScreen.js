import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';

export default function ActivityScreen() {
  const route = useRoute();
  const defaultTab = route.params?.defaultTab;
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [activeTab, setActiveTab] = useState(defaultTab || 'ongoing');
  const [ongoing, setOngoing]     = useState([]);
  const [expired, setExpired]     = useState([]);
  const [completed, setCompleted] = useState([]);
  const [rewards, setRewards]     = useState([]);

  const [loading, setLoading]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      // Fetch challenges
      const { data } = await axios.get(`${API_BASE_URL}/api/user-challenges`, { headers });
      const now = new Date();
      const o = [], x = [], c = [];

      data.forEach((uc) => {
        if (uc.status === 'completed') {
          c.push(uc);
        } else if (uc.status === 'active') {
          const end = uc.challengeId?.endDate ? new Date(uc.challengeId.endDate) : null;
          (end && end < now ? x : o).push(uc);
        } else if (uc.status === 'abandoned') {
          x.push(uc);
        }
      });

      setOngoing(o);
      setExpired(x);
      setCompleted(c);
      setSelectedIds(new Set());

      // Fetch reward notifications
      const notifRes = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
      const notifData = Array.isArray(notifRes.data) ? notifRes.data : notifRes.data.notifications || [];
      const rewardNotifs = notifData.filter(n => n && (n.type === 'reward_earned' || n.type === 'reward'));
      setRewards(rewardNotifs);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load activity.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => isActive && fetchData())();
      return () => { isActive = false; };
    }, [])
  );

  const quitOne = async (userChallengeId) => {
    const headers = await getAuthHeaders();
    await axios.patch(
      `${API_BASE_URL}/api/user-challenges/${userChallengeId}/status`,
      { status: 'abandoned' },
      { headers }
    );
  };

  const quitSelected = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(quitOne));
      Alert.alert('Done', `${selectedIds.size} challenge${selectedIds.size > 1 ? 's' : ''} quit`);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not quit selected challenges.');
    }
  };

  const renderChallenge = ({ item }) => {
    const c = item.challengeId;
    if (!c) return null;

    const isSelectable = activeTab === 'ongoing';
    const isSelected   = selectedIds.has(item._id);

    const toggleSelect = () => {
      if (!isSelectable) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next[isSelected ? 'delete' : 'add'](item._id);
        return next;
      });
    };

    const statusText =
      item.status === 'active'
        ? 'Ongoing'
        : item.status === 'abandoned'
          ? 'Quit'
          : 'Completed';

    return (
      <TouchableOpacity
        style={[
          s.card,
          isSelectable && Platform.OS === 'ios' && { paddingRight: 36 },
          isSelected && { borderColor: colors.tint, borderWidth: 2 },
        ]}
        activeOpacity={isSelectable ? 0.8 : 1}
        onPress={toggleSelect}
        onLongPress={toggleSelect}
      >
        {isSelectable && (
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={isSelected ? colors.tint : colors.textSecondary}
            style={s.checkIcon}
          />
        )}

        <Text style={s.title}>{c.title}</Text>
        <Text style={s.subtitle}>Ends • {new Date(c.endDate).toLocaleDateString()}</Text>
        <Text style={s.status}>{statusText}</Text>

        {isSelectable && selectedIds.size === 0 && (
          <TouchableOpacity
            style={s.quitChip}
            onPress={() =>
              Alert.alert(
                'Quit challenge?',
                'This will abandon the challenge.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Quit', style: 'destructive', onPress: () => quitOne(item._id).then(fetchData) },
                ]
              )
            }
          >
            <Ionicons name="exit-outline" size={16} color="#fff" />
            <Text style={s.quitChipText}>Quit</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderReward = ({ item }) => (
    <View style={s.card}>
      <Text style={s.title}>{item.message || 'Reward received'}</Text>
      <Text style={s.subtitle}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const tabData = { ongoing, expired, completed, rewards };
  const list = tabData[activeTab] || [];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.tabSwitcher}>
        {['ongoing','expired','completed','rewards'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, activeTab === t && s.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {list.length ? (
        <FlatList
          data={list}
          keyExtractor={(i) => i._id}
          renderItem={activeTab === 'rewards' ? renderReward : renderChallenge}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <Text style={s.empty}>No {activeTab} items</Text>
      )}

      {activeTab === 'ongoing' && selectedIds.size > 0 && (
        <View style={s.quitBar}>
          <Text style={s.quitBarText}>{selectedIds.size} selected</Text>
          <TouchableOpacity style={s.quitBarBtn} onPress={quitSelected}>
            <Ionicons name="exit-outline" size={20} color="#fff" />
            <Text style={s.quitBarBtnText}>Quit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: c.card,
      margin: 16,
      borderRadius: 32,
      padding: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    tab:        { flex: 1, paddingVertical: 10, borderRadius: 28, alignItems: 'center' },
    tabActive:  { backgroundColor: c.tint },
    tabText:    { color: c.textSecondary, fontSize: 13 },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    title:     { fontSize: 16, fontWeight: '600', color: c.text },
    subtitle:  { fontSize: 13, color: c.textSecondary, marginTop: 4 },
    status:    { fontSize: 12, marginTop: 6, fontStyle: 'italic', color: c.textSecondary },
    checkIcon: { position: 'absolute', right: 12, top: 12 },
    quitChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: c.error ?? '#dc2626',
      borderRadius: 14,
      marginTop: 10,
    },
    quitChipText: { color: '#fff', marginLeft: 4, fontSize: 12, fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 40, color: c.textSecondary },
    quitBar: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,

      padding: 16,
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.separator,
    },
    quitBarText: { color: c.text, fontSize: 15 },
    quitBarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 18,
      backgroundColor: c.tint,
      borderRadius: 22,
    },
    quitBarBtnText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  });
