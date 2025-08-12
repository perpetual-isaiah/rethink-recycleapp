// navigation/AdminStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminBottomTabs from './AdminBottomTabs'; // Main bottom tab navigator
import AdminProfileScreen from '../screens/AdminProfileScreen'; 
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminEditScreen from '../screens/AdminEditScreen'; // Admin edit screen


const Stack = createNativeStackNavigator();

export default function AdminStackNavigator({ route }) {

   const role = route?.params?.role ?? route?.params?.params?.role;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom Tabs as entry point for admin */}
      <Stack.Screen name="AdminBottomTabs" component={AdminBottomTabs} />
      
      {/* Stand-alone screen that Settings → Profile will open */}
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />

      <Stack.Screen name="ManageAdmins" component={AdminUsersScreen} />
      <Stack.Screen name="EditAdmin" component={AdminEditScreen}  />

    </Stack.Navigator>
  );
}
