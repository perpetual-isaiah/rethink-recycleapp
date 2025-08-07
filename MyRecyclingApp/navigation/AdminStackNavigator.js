// navigation/AdminStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminBottomTabs from './AdminBottomTabs'; // Main bottom tab navigator
import AdminProfileScreen from '../screens/AdminProfileScreen'; 


const Stack = createNativeStackNavigator();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom Tabs as entry point for admin */}
      <Stack.Screen name="AdminBottomTabs" component={AdminBottomTabs} />
      
      {/* Stand-alone screen that Settings → Profile will open */}
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />

    </Stack.Navigator>
  );
}
