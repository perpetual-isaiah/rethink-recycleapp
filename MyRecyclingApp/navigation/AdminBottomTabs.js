import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import AdminChallengesScreen from '../screens/AdminChallengesScreen';
import AdminRecyclingPointsScreen from '../screens/AdminRecyclingPointsScreen';
import AdminGuidesScreen from '../screens/AdminGuidesScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function AdminBottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="AdminHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'AdminHome':
              iconName = 'home-outline';
              break;
            case 'ManageChallenges':
              iconName = 'trophy-outline';
              break;
            case 'RecyclingPoints':
              iconName = 'location-outline';
              break;
            case 'Guides':
              iconName = 'book-outline';
              break;
            case 'AdminSettings':
              iconName = 'settings-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminHomeScreen}
        options={{ title: 'Dashboard' }}
      />

      <Tab.Screen
        name="ManageChallenges"
        component={AdminChallengesScreen}
        options={{ title: 'Challenges' }}
      />

      <Tab.Screen
        name="RecyclingPoints"
        component={AdminRecyclingPointsScreen}
        options={{ title: 'Recycle Points' }}
      />

      <Tab.Screen
        name="Guides"
        component={AdminGuidesScreen}
        options={{ title: 'Guides' }}
      />

      <Tab.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
