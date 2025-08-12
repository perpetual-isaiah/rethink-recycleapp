import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminChallengesScreen from '../screens/AdminChallengesScreen';
import AdminRecyclingPointsScreen from '../screens/AdminRecyclingPointsScreen';
import AdminGuidesScreen from '../screens/AdminGuidesScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();

export default function AdminBottomTabs() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role);
      } catch (error) {
        console.error('Error getting user role:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, []);

  // Define which roles can access which tabs
  const getAccessibleTabs = (role) => {
    const tabs = [];

    // Dashboard is accessible to all admin roles
    tabs.push({
      name: 'AdminHome',
      component: AdminHomeScreen,
      title: 'Dashboard',
      iconName: 'home-outline'
    });

    // Role-based tab access
    if (role === 'admin' || role === 'admin_full' || role === 'challenge_admin') {
      tabs.push({
        name: 'ManageChallenges',
        component: AdminChallengesScreen,
        title: 'Challenges',
        iconName: 'trophy-outline'
      });
    }

    if (role === 'admin' || role === 'admin_full' || role === 'recycling_admin') {
      tabs.push({
        name: 'RecyclingPoints',
        component: AdminRecyclingPointsScreen,
        title: 'Recycle Points',
        iconName: 'location-outline'
      });
    }

    if (role === 'admin' || role === 'admin_full' || role === 'guide_admin') {
      tabs.push({
        name: 'Guides',
        component: AdminGuidesScreen,
        title: 'Guides',
        iconName: 'book-outline'
      });
    }

    // Settings is accessible to all admin roles
    tabs.push({
      name: 'AdminSettings',
      component: AdminSettingsScreen,
      title: 'Settings',
      iconName: 'settings-outline'
    });

    return tabs;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  const accessibleTabs = getAccessibleTabs(userRole);

  return (
    <Tab.Navigator
      initialRouteName="AdminHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          const tab = accessibleTabs.find(t => t.name === route.name);
          const iconName = tab?.iconName || 'help-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {accessibleTabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ title: tab.title }}
        />
      ))}
    </Tab.Navigator>
  );
}