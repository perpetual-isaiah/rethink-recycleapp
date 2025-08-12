import React, { useEffect, useState, useRef } from 'react';
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
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

const RecyclingPointsScreen = ({ route, navigation }) => {
  const { colors, darkMode } = useTheme();
  const styles = getStyles(colors, darkMode);

  const mapRef    = useRef(null);
  const scrollRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Map');
  const [searchText, setSearchText] = useState('');
  const [recyclingPoints, setRecyclingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // NEW: material filter coming from GuideDetailScreen
  const [filterMaterial, setFilterMaterial] = useState(route?.params?.material || null);

  // request location and load recycling points
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location permission to use this feature');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

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

  // Distance (haversine)
  const distanceKm = (a, b) => {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // If a material is provided: auto-select nearest matching point and jump to it
  useEffect(() => {
    if (!location || !recyclingPoints.length || !filterMaterial) return;

    const candidates = recyclingPoints.filter(p =>
      p.materials.map(m => m.toLowerCase()).includes(filterMaterial.toLowerCase())
    );
    if (!candidates.length) return;

    let best = candidates[0];
    let bestD = distanceKm(location, { latitude: best.lat, longitude: best.lng });
    for (let i = 1; i < candidates.length; i++) {
      const d = distanceKm(location, { latitude: candidates[i].lat, longitude: candidates[i].lng });
      if (d < bestD) { best = candidates[i]; bestD = d; }
    }

    setSelectedPoint(best);
    setActiveTab('Map');

    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion({
        latitude: best.lat,
        longitude: best.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [location, recyclingPoints, filterMaterial]);

  // Filter list by search + (optional) material
  const filteredPoints = recyclingPoints.filter(point => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchText.toLowerCase()) ||
      point.address.toLowerCase().includes(searchText.toLowerCase()) ||
      point.region.toLowerCase().includes(searchText.toLowerCase()) ||
      (point.city && point.city.toLowerCase().includes(searchText.toLowerCase()));
    const matchesMaterial = !filterMaterial
      ? true
      : point.materials.map(m => m.toLowerCase()).includes(filterMaterial.toLowerCase());
    return matchesSearch && matchesMaterial;
  });

  // When selectedPoint or activeTab changes to "Map", animate the map
  useEffect(() => {
    if (activeTab === 'Map' && selectedPoint && mapRef.current) {
      scrollRef.current?.scrollTo({ y: 0, animated: true }); // show map
      mapRef.current.animateToRegion({
        latitude: selectedPoint.lat,
        longitude: selectedPoint.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [activeTab, selectedPoint]);

  // Select a point from the list: switch to map and store selection
  const handleListItemPress = (point) => {
    setSelectedPoint(point);
    setActiveTab('Map');
  };

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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, city, or region"
            placeholderTextColor={darkMode ? colors.textSecondary : '#888'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Material filter chip */}
        {filterMaterial && (
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>
              Filter: {filterMaterial.charAt(0).toUpperCase() + filterMaterial.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => setFilterMaterial(null)}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Map or List */}
        {activeTab === 'Map' ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
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
                  onPress={() => setSelectedPoint(point)}
                >
                  <View style={[
                    styles.markerContainer,
                    selectedPoint?._id === point._id && styles.selectedMarker
                  ]}>
                    <Ionicons
                      name="leaf"
                      size={24}
                      color={selectedPoint?._id === point._id ? '#fff' : colors.tint}
                    />
                  </View>
                </Marker>
              ))}
            </MapView>

            {/* Info card */}
            {selectedPoint && (
              <View style={styles.infoCard}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedPoint(null)}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <Text style={styles.infoCardTitle}>{selectedPoint.name}</Text>
                <Text style={styles.infoCardAddress}>{selectedPoint.address}</Text>
                {selectedPoint.city && (
                  <Text style={styles.infoCardCity}>{selectedPoint.city}</Text>
                )}
                <Text style={styles.infoCardRegion}>{selectedPoint.region}</Text>
                <Text style={styles.infoCardMaterials}>
                  Accepts{' '}
                  <Text style={{ color: colors.tint }}>
                    {selectedPoint.materials.join(', ')}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredPoints.map(point => (
              <TouchableOpacity
                key={point._id}
                style={styles.pointCard}
                onPress={() => handleListItemPress(point)}
                activeOpacity={0.7}
              >
                <View style={styles.pointCardHeader}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  <Ionicons name="location-outline" size={20} color={colors.tint} />
                </View>
                <Text style={styles.address}>{point.address}</Text>
                {point.city && <Text style={styles.city}>{point.city}</Text>}
                <Text style={styles.region}>{point.region}</Text>
                <Text style={styles.materials}>
                  Accepts{' '}
                  <Text style={{ color: colors.tint }}>
                    {point.materials.join(', ')}
                  </Text>
                </Text>
                <Text style={styles.tapHint}>Tap to view on map</Text>
              </TouchableOpacity>
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? c.bg : '#f9fafb' },

    header: { padding: 10, backgroundColor: dark ? c.card : '#fff' },
    searchInput: {
      backgroundColor: dark ? c.separator : '#eee',
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
      color: c.text,
    },

    // chip
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginLeft: 10,
      marginBottom: 6,
      backgroundColor: dark ? c.card : '#e8f5e9',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterText: { color: c.text, fontWeight: '600', marginRight: 6 },
    clearText: { color: c.tint, fontSize: 18, fontWeight: '700' },

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
    activeTab: { backgroundColor: dark ? c.card : '#fff' },
    tabText: { fontSize: 14, color: dark ? c.textSecondary : '#6b7280' },
    activeTabText: { color: c.text, fontWeight: '600' },

    mapContainer: {
      flex: 1,
      marginHorizontal: 10,
      borderRadius: 16,
      overflow: 'hidden',
      height: height * 0.6,
      position: 'relative',
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
    selectedMarker: { backgroundColor: c.tint, transform: [{ scale: 1.2 }] },

    infoCard: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: dark ? c.card : '#fff',
      borderRadius: 12,
      padding: 15,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    closeButton: { position: 'absolute', top: 10, right: 10, padding: 5 },
    infoCardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: c.text, marginRight: 30 },
    infoCardAddress: { fontSize: 14, color: c.textSecondary },
    infoCardCity: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    infoCardRegion: { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
    infoCardMaterials: { fontSize: 14, color: c.text },

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
    pointCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    pointName: { fontWeight: 'bold', fontSize: 16, color: c.text, flex: 1 },
    address: { fontSize: 14, color: c.textSecondary },
    city: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    region: { fontSize: 12, color: c.textSecondary, marginBottom: 4 },
    materials: { fontSize: 14, color: c.text, marginBottom: 8 },
    tapHint: { fontSize: 12, color: c.tint, fontStyle: 'italic', textAlign: 'center' },
  });

export default RecyclingPointsScreen;
