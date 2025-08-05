// screens/HomeScreen.js
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons, FontAwesome5,
} from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import NotificationBadge from '../components/NotificationBadge';
import ChatUnreadBadge from '../components/ChatUnreadBadge';
import { logoutAndReset } from '../utils/auth';


// Expo notification config for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors, darkMode } = useTheme();

  const [user, setUser] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);
  const [rewardCount, setRewardCount] = useState(0);

  // Guide icons/materials
  const guideMaterials = [
    { key: 'plastic', label: 'Plastic', Icon: MaterialCommunityIcons, name: 'bottle-soda' },
    { key: 'glass', label: 'Glass', Icon: MaterialCommunityIcons, name: 'glass-fragile' },
    { key: 'paper', label: 'Paper', Icon: Ionicons, name: 'document-text-outline' },
    { key: 'metal', label: 'Metal', Icon: FontAwesome5, name: 'industry' },
    { key: 'carton', label: 'Carton', Icon: MaterialCommunityIcons, name: 'package-variant' },
    { key: 'ewaste', label: 'E-Waste', Icon: MaterialCommunityIcons, name: 'desktop-classic' },
    { key: 'organic', label: 'Organic', Icon: MaterialCommunityIcons, name: 'leaf' },
    { key: 'batteries', label: 'Batteries', Icon: MaterialCommunityIcons, name: 'battery-alert' },
    { key: 'clothes', label: 'Clothes', Icon: MaterialCommunityIcons, name: 'tshirt-crew' },
    { key: 'tires', label: 'Tires', Icon: MaterialCommunityIcons, name: 'car-tire-alert' },
    { key: 'construction', label: 'Construction', Icon: MaterialCommunityIcons, name: 'hammer-screwdriver' },
  ];

  // Register for push notifications (asks permission & saves token)
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      try {
        // Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
        if (!Device.isDevice) {
          Alert.alert('Error', 'Push notifications only work on physical devices!');
          return;
        }

        // Permission flow
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Permission Required', 'Enable notifications in device settings to receive updates!');
          return;
        }

        // Get and save Expo push token
        try {
          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;
          if (!projectId) throw new Error('Expo projectId not found.');
          const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          console.log('[Push] Expo Push Token:', expoPushToken);

          // Save token to backend
          const token = await AsyncStorage.getItem('token');
          if (token && expoPushToken) {
            await axios.post(
              `${API_BASE_URL}/api/user/savePushToken`,
              { pushToken: expoPushToken },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('[Push] Push token saved!');
          }
        } catch (err) {
          console.error('[Push] Error saving push token:', err.message);
        }
      } catch (e) {
        console.log('[Push] Error registering notifications:', e.message);
      }
    }

    registerForPushNotificationsAsync();

    // Foreground notification listener
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Notification received:', notification);
      // You can show an in-app banner or update state/UI here
    });

    // When user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Push] Notification response:', response);
      const data = response.notification.request.content.data;
      if (data?.type === 'challenge_created') navigation.navigate('MyChallenges');
      else if (data?.type === 'reward_earned') navigation.navigate('Activity', { defaultTab: 'rewards' });
      else if (data?.type === 'challenge_completed') navigation.navigate('MyChallenges');
      // add more cases as needed
    });

    // Cleanup listeners on unmount
    return () => {
      notificationListener && Notifications.removeNotificationSubscription(notificationListener);
      responseListener && Notifications.removeNotificationSubscription(responseListener);
    };
  }, [navigation]);

  // Fetch user and stats
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token – user probably logged-out');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. profile
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/user/profile`, { headers });
        setUser({ name: data.user.name ?? '', location: data.user.city ?? 'Unknown' });
      } catch (e) {
        console.error('[profile] →', e.response?.status, e.response?.data);
      }

      // 2. challenges
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/user-challenges`, { headers });
        setChallengeCount(data.filter(u => u.status === 'active').length);
      } catch (e) {
        console.error('[user-challenges] →', e.response?.status, e.response?.data);
        setChallengeCount(0);
      }

      // 3. rewards
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/rewards/claimed`, { headers });
        setRewardCount(data.rewards?.length ?? 0);
      } catch (e) {
        console.error('[rewards/claimed] →', e.response?.status, e.response?.data);
        setRewardCount(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run on focus
  useFocusEffect(useCallback(() => { fetchUserData(); }, []));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserData(); }, []);

  const logout = () => logoutAndReset(navigation);

  // Styles
  const s = getStyles(colors, darkMode);

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? colors.bg : '#F2FAF2' }}>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
       
  <View style={s.header}>
          <View style={s.logoWrap}>
            <Image source={require('../assets/logo2s.png')} style={s.logoImg} />
            <Text style={s.logoTxt}>Re<Text style={{ color: colors.tint }}>Think</Text></Text>
          </View>
          <View style={s.headerIcons}>
            <NotificationBadge 
              onPress={() => navigation.navigate('Notifications')} 
              iconColor={colors.text}
              iconSize={22}
              containerStyle={s.notificationContainer}  // Added container style
            />
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')} 
              style={s.profileIcon}  // Changed to dedicated style
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={s.logoutIcon}>
              <Ionicons name="exit-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
  </View>
</View>

        {/* greeting */}
        <Text style={s.greet}>Hi, {user.name || '...'}</Text>
        <Text style={s.tag}>Let's contribute to our earth.</Text>
        <View style={s.locationBox}>
          <Ionicons name="location-sharp" size={25} color={colors.tint} />
          <Text style={s.locationTxt}>{user.location}</Text>
        </View>

        {/* guide carousel */}
        <Text style={s.sectionHd}>Recycling Guide</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carousel}>
          {guideMaterials.map(({ key, label, Icon, name }) => (
            <TouchableOpacity
              key={key}
              style={s.guideCard}
              onPress={() => navigation.navigate('Guide', { material: key })}
            >
              <Icon name={name} size={26} color={colors.tint} />
              <Text style={s.guideLbl}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* stat cards */}
        <View style={s.grid}>
          <TouchableOpacity style={[s.statCard, s.challengeBg]} onPress={() => navigation.navigate('MyChallenges')}>
            <Ionicons name="trophy-outline" size={28} color="#fff" style={s.statIcon}/>
            <Text style={s.statVal}>{challengeCount}</Text>
            <Text style={s.statLbl}>Challenges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.statCard, s.rewardBg]} onPress={() => navigation.navigate('Activity', { defaultTab: 'rewards' })}>
            <Ionicons name="star-outline" size={28} color="#fff" style={s.statIcon}/>
            <Text style={s.statVal}>{rewardCount}</Text>
            <Text style={s.statLbl}>Rewards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.statCard, s.impactBg]} onPress={() => navigation.navigate('Activity')}>
            <Ionicons name="analytics-outline" size={28} color="#fff" style={s.statIcon}/>
            <Text style={s.statVal}>View</Text>
            <Text style={s.statLbl}>Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.statCard, s.createBg]} onPress={() => navigation.navigate('CreateChallenge')}>
            <Ionicons name="add-circle-outline" size={28} color="#fff" style={s.statIcon}/>
            <Text style={s.statVal}>Create</Text>
            <Text style={s.statLbl}>Challenge</Text>
          </TouchableOpacity>
        </View>

        
      </ScrollView>

      <TouchableOpacity
  style={s.fabChat}
  onPress={() => navigation.navigate('CommunityChatsScreen')}
  activeOpacity={0.8}
>
  <Ionicons name="chatbubbles-outline" size={30} color="#fff" />
  <ChatUnreadBadge style={{ right: 2, top: 2 }} />
</TouchableOpacity> 

    </SafeAreaView>
  );
}

// theme-aware stylesheet
const getStyles = (c, dark) => StyleSheet.create({
  container: { padding: 16, backgroundColor: dark ? c.bg : '#f9fafb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

   header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingBottom: 8,  // Added bottom padding for better spacing
  },
  headerIcons: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 22,  // Uniform spacing between all icons
  },
  notificationContainer: {
    marginRight: 2,  // Fine-tune notification badge position
  },
  profileIcon: {
    marginHorizontal: 14,  // Horizontal padding around profile icon
  },
  logoutIcon: {
    marginLeft: 4,  // Small left margin for logout icon
  },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap:    { flexDirection: 'row', alignItems: 'center' },
  logoImg:     { width: 50, height: 50, marginRight: 8 },
  logoTxt:     { fontSize: 25, fontWeight: '700', color: c.text },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconPad:     { marginRight: 20 },

  greet: { fontSize: 25, fontWeight: '600', marginTop: 16, color: c.text },
  tag:   { fontSize: 18, color: c.textSecondary },

  locationBox: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: dark ? c.card : '#fff',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14,
    borderWidth: 1, borderColor: dark ? c.separator : '#D1D5DB',
  },
  locationTxt: { marginLeft: 6, color: c.text, fontSize: 20 },

  sectionHd: { marginTop: 24, fontSize: 16, fontWeight: '700', color: c.text },
  carousel:  { marginTop: 12 },
  guideCard: {
    width: 80, height: 80, marginRight: 12, borderRadius: 12,
    backgroundColor: dark ? c.card : '#DFFFD8',
    justifyContent: 'center', alignItems: 'center',
  },
  guideLbl: { fontSize: 16, color: c.text, marginTop: 6, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  statCard:{ width: '47%', borderRadius: 12, padding: 16, marginBottom: 16 },
  statIcon:{ alignSelf: 'center', marginBottom: 8 },
  statVal: { textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 18 },
  statLbl: { textAlign: 'center', color: '#fff', fontSize: 12 },

  challengeBg: { backgroundColor: '#3B82F6' },
  rewardBg:    { backgroundColor: '#F59E0B' },
  impactBg:    { backgroundColor: '#22C55E' },
  createBg:    { backgroundColor: '#8B5CF6' },

  fabChat: {
  position: 'absolute',
  right: 24,
  bottom: 100,
  backgroundColor: '#3B82F6', // Use your theme color if you want
  borderRadius: 30,
  width: 56,
  height: 56,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
},

});
