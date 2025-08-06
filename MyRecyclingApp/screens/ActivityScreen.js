// screens/ActivityScreen.js
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';   // ← NEW
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';

export default function ActivityScreen() {
  /* ───────────────────────────────────────── hooks/ctx ───────────────────────────────────────── */
  const route          = useRoute();
  const defaultTab     = route.params?.defaultTab;
  const { colors }     = useTheme();
  const s              = getStyles(colors);
  const tabBarHeight   = useBottomTabBarHeight();                        // ← NEW

  /* ───────────────────────────────────────── state ──────────────────────────────────────────── */
  const [activeTab, setActiveTab]     = useState(defaultTab || 'ongoing');
  const [ongoing, setOngoing]         = useState([]);
  const [expired, setExpired]         = useState([]);
  const [completed, setCompleted]     = useState([]);
  const [rewards, setRewards]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ───────────────────────────────────────── helpers ────────────────────────────────────────── */
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      // --- challenges
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

      setOngoing(o); setExpired(x); setCompleted(c); setSelectedIds(new Set());

      // --- reward notifications
      const nr  = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
      const nd  = Array.isArray(nr.data) ? nr.data : nr.data.notifications || [];
      const rwd = nd.filter(n => n && (n.type === 'reward' || n.type === 'reward_earned'));
      setRewards(rwd);
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
      let mounted = true;
      (async () => mounted && fetchData())();
      return () => { mounted = false; };
    }, [])
  );

  /* ───────────────────────────────────────── quit helpers ───────────────────────────────────── */
  const quitOne = async (id) => {
    const headers = await getAuthHeaders();
    await axios.patch(
      `${API_BASE_URL}/api/user-challenges/${id}/status`,
      { status: 'abandoned' },
      { headers }
    );
  };

  const quitSelected = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(quitOne));
      Alert.alert('Success', `${selectedIds.size} challenge${selectedIds.size > 1 ? 's' : ''} quit`);
      fetchData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not quit selected challenges.');
    }
  };

  /* ───────────────────────────────────────── render helpers ─────────────────────────────────── */
  const handleTabChange = (t) => { setActiveTab(t); setSelectedIds(new Set()); };

  const renderChallenge = ({ item }) => {
    const c           = item.challengeId;
    if (!c) return null;
    const isSelectable = activeTab === 'ongoing';
    const isSelected   = selectedIds.has(item._id);

    const toggleSelect = () => {
      if (!isSelectable) return;
      setSelectedIds(prev => {
        const next = new Set(prev);
        next[isSelected ? 'delete' : 'add'](item._id);
        return next;
      });
    };

    const statusText =
      item.status === 'active'    ? 'Ongoing' :
      item.status === 'abandoned' ? 'Quit'     : 'Completed';

    return (
      <TouchableOpacity
        style={[
          s.card,
          isSelectable && Platform.OS==='ios' && { paddingRight: 36 },
          isSelected && { borderColor: colors.tint, borderWidth: 2 },
        ]}
        activeOpacity={isSelectable ? 0.8 : 1}
        onPress={isSelectable ? toggleSelect : undefined}
        onLongPress={isSelectable ? toggleSelect : undefined}
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
        <Text style={s.subtitle}>
          Ends • {new Date(c.endDate).toLocaleDateString()}
        </Text>
        <Text style={s.status}>{statusText}</Text>

        {isSelectable && selectedIds.size === 0 && (
          <TouchableOpacity
            style={s.quitChip}
            onPress={() =>
              Alert.alert(
                'Quit Challenge',
                `Quit "${c.title}"? This can’t be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Quit',  style: 'destructive',
                    onPress: () => quitOne(item._id).then(fetchData) },
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
      <Text style={s.subtitle}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  /* ───────────────────────────────────────── render ────────────────────────────────────────── */
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const dataByTab    = { ongoing, expired, completed, rewards };
  const list         = dataByTab[activeTab] || [];
  const hasSelection = selectedIds.size > 0;

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safeArea}>
        {/* tabs */}
        <View style={s.tabSwitcher}>
          {['ongoing','expired','completed','rewards'].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, activeTab===t && s.tabActive]}
              onPress={() => handleTabChange(t)}
            >
              <Text style={[s.tabText, activeTab===t && s.tabTextActive]}>
                {t[0].toUpperCase()+t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* list */}
        {list.length ? (
          <FlatList
            data={list}
            keyExtractor={i => i._id}
            renderItem={activeTab==='rewards' ? renderReward : renderChallenge}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              paddingBottom: (hasSelection ? 120 : 100) + tabBarHeight,  // ← NEW
            }}
          />
        ) : (
          <Text style={s.empty}>No {activeTab} items</Text>
        )}
      </SafeAreaView>

   {/* Quit bar */}
{activeTab === 'ongoing' && hasSelection && (
  <View style={[s.quitBar, { bottom: tabBarHeight }]}>
    <View style={s.quitBarLeft}>
      {/* 1️⃣  keep everything inside one <Text> */}
      <Text style={s.quitBarText}>{`${selectedIds.size} selected`}</Text>

      <TouchableOpacity onPress={() => setSelectedIds(new Set())}>
        <Text style={s.clearSelectionText}>Clear</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={s.quitBarBtn}
      onPress={() =>
        Alert.alert(
          'Quit Challenges',
          `Quit ${selectedIds.size} selected challenge${selectedIds.size > 1 ? 's' : ''}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: quitSelected },
          ],
        )
      }
    >
      <Ionicons name="exit-outline" size={20} color="#fff" />
      {/* 2️⃣  single string expression—no stray whitespace */}
      <Text style={s.quitBarBtnText}>
        {`Quit${selectedIds.size > 1 ? ' All' : ''}`}
      </Text>
    </TouchableOpacity>
  </View>
)}

    </View>
  );
}

/* ───────────────────────────────────────── styles ─────────────────────────────────────────── */
const getStyles = (c) => StyleSheet.create({
  container:  { flex:1, backgroundColor:c.bg },
  safeArea:   { flex:1 },
  center:     { flex:1, justifyContent:'center', alignItems:'center' },

  /* tab switcher */
  tabSwitcher:{ flexDirection:'row', backgroundColor:c.card, margin:16,
    borderRadius:32, padding:4, elevation:2,
    shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4 },
  tab:        { flex:1, paddingVertical:10, borderRadius:28, alignItems:'center' },
  tabActive:  { backgroundColor:c.tint },
  tabText:    { color:c.textSecondary, fontSize:13 },
  tabTextActive:{ color:'#fff', fontWeight:'600' },

  /* cards */
  card:{ backgroundColor:c.card, borderRadius:14, padding:16,
    marginHorizontal:16, marginVertical:8,
    shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2 },
  title:     { fontSize:16, fontWeight:'600', color:c.text },
  subtitle:  { fontSize:13, color:c.textSecondary, marginTop:4 },
  status:    { fontSize:12, marginTop:6, fontStyle:'italic', color:c.textSecondary },
  checkIcon: { position:'absolute', right:12, top:12 },

  /* single quit chip */
  quitChip:{ flexDirection:'row', alignItems:'center', alignSelf:'flex-start',
    paddingHorizontal:10, paddingVertical:4, backgroundColor:c.error ?? '#dc2626',
    borderRadius:14, marginTop:10 },
  quitChipText:{ color:'#fff', marginLeft:4, fontSize:12, fontWeight:'600' },

  empty:{ textAlign:'center', marginTop:40, color:c.textSecondary },

  /* quit bar */
  quitBar:{ position:'absolute', left:0, right:0,
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:16, paddingVertical:16, backgroundColor:c.card,
    borderTopWidth:StyleSheet.hairlineWidth,
    borderTopColor:c.separator ?? c.textSecondary+'20',
    zIndex:30, elevation:8,                           // sit above tabs
    shadowColor:'#000', shadowOpacity:0.1, shadowRadius:8,
    shadowOffset:{ width:0, height:-2 } },
  quitBarLeft:{ flexDirection:'row', alignItems:'center', flexShrink:1 },
  quitBarText:{ color:c.text, fontSize:15, fontWeight:'500', marginRight:12 },
  clearSelectionText:{ color:c.tint, fontSize:14, fontWeight:'500' },
  quitBarBtn:{ flexDirection:'row', alignItems:'center', paddingVertical:10,
    paddingHorizontal:20, backgroundColor:c.error ?? '#dc2626',
    borderRadius:24, elevation:2, shadowColor:'#000', shadowOpacity:0.1,
    shadowRadius:4, shadowOffset:{ width:0, height:2 } },
  quitBarBtnText:{ color:'#fff', marginLeft:6, fontSize:15, fontWeight:'600' },
});
