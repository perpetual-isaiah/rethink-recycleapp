// screens/RecyclingPointsScreen.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext'; // ← import

const { height } = Dimensions.get('window');

const RecyclingPointsScreen = () => {
  const { colors, darkMode } = useTheme();           // ← grab palette + flag
  const styles = getStyles(colors, darkMode);        // ← dynamic styles

  const [activeTab, setActiveTab]       = useState('Map');
  const [searchText, setSearchText]     = useState('');
  const [recyclingPoints, setRecyclingPoints] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [location, setLocation]         = useState(null);

  useEffect(() => {
    (async () => {
      // request permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location permission to use this feature');
        setLoading(false);
        return;
      }

      // get position
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      // fetch points
      try {
        const res = await axios.get(`${API_BASE_URL}/api/recycling-points`);
        setRecyclingPoints(res.data);
      } catch (e) {
        Alert.alert('Error', 'Failed to load recycling points');
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPoints = recyclingPoints.filter(point =>
    point.name.toLowerCase().includes(searchText.toLowerCase()) ||
    point.address.toLowerCase().includes(searchText.toLowerCase()) ||
    point.region.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: colors.text }}>Please enable location services</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? colors.bg : '#f9fafb'}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, or region"
            placeholderTextColor={darkMode ? colors.textSecondary : '#888'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['Map', 'List'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'Map' ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              {filteredPoints.map(point => (
                <Marker
                  key={point._id}
                  coordinate={{ latitude: point.lat, longitude: point.lng }}
                  title={point.name}
                  description={point.materials.join(', ')}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="leaf" size={24} color={colors.tint} />
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredPoints.map(point => (
              <View key={point._id} style={styles.pointCard}>
                <Text style={styles.pointName}>{point.name}</Text>
                <Text style={styles.address}>{point.address}</Text>
                <Text style={styles.region}>{point.region}</Text>
                <Text style={styles.materials}>
                  Accepts: <Text style={{ color: colors.tint }}>{point.materials.join(', ')}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (c, dark) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: dark ? c.bg : '#f9fafb' },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? c.bg : '#f9fafb' },

    header: { padding: 10, backgroundColor: dark ? c.card : '#fff' },
    searchInput: {
      backgroundColor: dark ? c.separator : '#eee',
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
      color: c.text,
    },

    tabContainer: {
      flexDirection: 'row',
      backgroundColor: dark ? c.separator : '#e5e7eb',
      margin: 10,
      borderRadius: 25,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 21,
    },
    activeTab: {
      backgroundColor: dark ? c.card : '#fff',
    },
    tabText: {
      fontSize: 14,
      color: dark ? c.textSecondary : '#6b7280',
    },
    activeTabText: {
      color: c.text,
      fontWeight: '600',
    },

    mapContainer: {
      flex: 1,
      marginHorizontal: 10,
      borderRadius: 16,
      overflow: 'hidden',
      height: height * 0.6,
    },
    map: { flex: 1 },

    markerContainer: {
      width: 40,
      height: 40,
      backgroundColor: dark ? c.card : '#fff',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: c.tint,
    },

    listContainer: { flexGrow: 1, marginHorizontal: 10 },

    pointCard: {
      backgroundColor: dark ? c.card : '#fff',
      padding: 15,
      borderRadius: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    pointName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: c.text },
    address:   { fontSize: 14, color: c.textSecondary },
    region:    { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
    materials: { fontSize: 14 },

  });

export default RecyclingPointsScreen;
