// utils/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function logoutAndReset(navigation) {
  try {
    const expoPushToken = await AsyncStorage.getItem('expoPushToken');
    const token = await AsyncStorage.getItem('token');
    if (expoPushToken && token) {
      // Tell backend to remove this push token from user/device
      await axios.post(
        `${API_BASE_URL}/api/user/remove-push-token`,
        { token: expoPushToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  } catch (err) {
    // Safe to ignore; fallback to just removing local token
  }

  await AsyncStorage.removeItem('token');
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}
