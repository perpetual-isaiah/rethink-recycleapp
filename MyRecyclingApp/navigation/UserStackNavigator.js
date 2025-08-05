// navigation/UserStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs'; 

// Import screens that should be OUTSIDE the tab navigator
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ChallengeDetailsScreen from '../screens/ChallengeDetailsScreen';
import MyChallengesScreen from '../screens/MyChallengesScreen';
import MyChallengesDetailsScreen from '../screens/MyChallengesDetailsScreen';
import MapScreen from '../screens/MapScreen';
import GuideScreen from '../screens/GuideScreen';
import GuideDetailScreen from '../screens/GuideDetailScreen';
import ResetCodeScreen from '../screens/ResetCodeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'; 
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationScreen from '../screens/NotificationScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import CommunityChatsScreen from '../screens/CommunityChatsScreen';
import ChallengeChatScreen from '../screens/ChallengeChatScreen';

const Stack = createNativeStackNavigator();

export default function UserStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainApp" screenOptions={{ headerShown: false }}>
      {/* BottomTabs is now the main/initial screen */}
      <Stack.Screen name="MainApp" component={BottomTabs} options={{ headerShown: false }} />
      
      {/* Modal/Detail screens that should appear over the tabs */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: true }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile', headerShown: true }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Community Challenges', headerShown: true }} />
      <Stack.Screen name="ChallengeDetails" component={ChallengeDetailsScreen} options={{ title: 'Challenge Details', headerShown: true }} />
      <Stack.Screen name="MyChallenges" component={MyChallengesScreen} options={{ title: 'My Challenges', headerShown: true }} />
      <Stack.Screen name="MyChallengesDetails" component={MyChallengesDetailsScreen} options={{ title: 'My Challenge Details', headerShown: true }} />
      <Stack.Screen name="MapScreen" component={MapScreen} options={{ title: 'Map', headerShown: true }} />
      <Stack.Screen name="Guide" component={GuideScreen} options={{ title: 'Guides', headerShown: true }} />
      <Stack.Screen name="GuideDetail" component={GuideDetailScreen} options={{ title: 'Guide Details', headerShown: true }} />
      <Stack.Screen name="ResetCode" component={ResetCodeScreen} options={{ headerShown: true }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot Password', headerShown: true }} />
      <Stack.Screen name="Password" component={ChangePasswordScreen} options={{ title: 'Password', headerShown: true }} />
      <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications', headerShown: true }} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{ headerShown: true }} />
      <Stack.Screen name="CommunityChatsScreen" component={CommunityChatsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="ChallengeChatScreen" component={ChallengeChatScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}