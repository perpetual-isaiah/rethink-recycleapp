// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './context/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Alert } from 'react-native';



// Import screens used outside User stack
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import CongratulationsScreen from './screens/CongratulationsScreen';
import CountrySelectionScreen from './screens/CountrySelectionScreen';
import CountryCityScreen from './screens/CountryCityScreen';
import LocationPermissionScreen from './screens/LocationPermissionScreen';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoadingScreen from './screens/LoadingScreen';
import ResetCodeScreen from './screens/ResetCodeScreen';

// Import the new UserStackNavigator
import UserStackNavigator from './navigation/UserStackNavigator';
import AdminStackNavigator from './navigation/AdminStackNavigator';


const Stack = createNativeStackNavigator();

export default function App() {

   useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        "New Notification",
        notification.request?.content?.body || "You have a new notification!"
      );
    });
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            
            {/* Onboarding and Splash */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen name="Landing" component={LandingScreen} />

            {/* Auth screens */}
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Login' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: true, title: 'Sign Up' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: 'Verification' }} />
            <Stack.Screen name="Congratulations" component={CongratulationsScreen} options={{ title: '' }} />
            <Stack.Screen name="ResetCode" component={ResetCodeScreen} options={{ title: 'Enter Code' }} />


            {/* Optional country and location permissions */}
            <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} options={{ title: 'Select Country' }} />
            <Stack.Screen name="CountryCityScreen" component={CountryCityScreen} options={{ title: 'Select City' }} />
            <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} options={{ title: 'Location Access' }} />

            {/* User flow navigator */}
            <Stack.Screen name="User" component={UserStackNavigator} options={{ headerShown: false }} />
            {/* Admin flow */}
            <Stack.Screen name="Admin" component={AdminStackNavigator} options={{ headerShown: false }} />

             

          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </ThemeProvider>
  );
}
