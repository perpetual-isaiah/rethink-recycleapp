import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Button, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function MapScreen({ route, navigation }) {
  const { userLocation } = route.params;
  const [selectedLocation, setSelectedLocation] = useState(userLocation);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        Alert.alert('Error', 'Authentication token not found.');
        navigation.navigate('Login');
      } else {
        setToken(storedToken);
      }
    };

    fetchToken();
  }, []);

  const onMapPress = (event) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const saveLocation = async () => {
    if (!token) {
      Alert.alert('Error', 'Token is missing.');
      return;
    }

    try {
      // 🔍 Reverse geocode to get city/place name
      const reverseRes = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: selectedLocation.latitude,
          lon: selectedLocation.longitude,
          format: 'json',
        },
      });

      const address = reverseRes.data.address;
      const cityName =
        address.city || address.town || address.village || address.county || 'Unknown';

      // ✅ Save location + city to backend
      await axios.put(
        `${API_BASE_URL}/api/user/location`,
        {
          location: selectedLocation,
          city: cityName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', `Location (${cityName}) saved!`);
      navigation.replace('User' , { screen: 'MainApp'}); // or your next screen   navigation.navigate('User', { screen: 'Home' });
    } catch (error) {
      console.error('Save Location Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
    }
  };

  if (!selectedLocation) {
    return (
      <View style={styles.center}>
        <Text>No location selected.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={onMapPress}
      >
        <Marker coordinate={selectedLocation} title="Selected Location" />
      </MapView>

      <View style={styles.buttonContainer}>
        <Button title="Save Location" onPress={saveLocation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
