// GuideScreen.js  –  “single-material only” version
// GuideScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext'; // <--- ADD THIS LINE

const TAG_COLORS = {
  'Blue container':   '#4da6ff',
  'Green container':  '#33cc33',
  'Organic container':'#99cc33',
  'Brown container':  '#a0522d',
  'Yellow container': '#f2c94c',
  'Red container':    '#e74c3c',
  'Black container':  '#333333',
  'Gray container':   '#b0b0b0',
};

export default function GuideScreen() {
  const navigation               = useNavigation();
  const { params }               = useRoute();
  const { colors, darkMode }     = useTheme(); // <--- ADD

  const selectedMaterialKey      = params?.material;
  const [guides, setGuides]      = useState([]);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuides = async () => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/guides`);
      const data = await res.json();
      setGuides(data);
    } catch (e) {
      console.error('Failed to fetch guides:', e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchGuides();
      setLoading(false);
    })();
  }, [selectedMaterialKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGuides();
    setRefreshing(false);
  };

  const materialGuide = guides.find((g) => g.key === selectedMaterialKey);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  if (materialGuide) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* hero banner */}
          <View style={[styles.greenTop, { backgroundColor: darkMode ? colors.tint : '#1A691A' }]}>
            <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
              <Text style={[styles.backArrow, { color: colors.text } ]}>←</Text>
            </TouchableOpacity>
            <Image source={require('../assets/earth.png')} style={styles.earthLogo} />
          </View>

          {/* white card */}
          <View style={styles.contentContainer}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {/* header */}
              <View style={styles.headerContainer}>
                <Text style={[styles.materialTitle, { color: colors.text }]}>
                  {materialGuide.description}
                </Text>
                {materialGuide.containerTag && (
                  <View
                    style={[
                      styles.containerTagBox,
                      { backgroundColor: TAG_COLORS[materialGuide.containerTag] || '#999' },
                    ]}
                  >
                    <Text style={styles.containerTagText}>{materialGuide.containerTag}</Text>
                  </View>
                )}
              </View>

              {/* steps */}
              {materialGuide.steps?.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.stepText, { color: colors.text }]}>{s}</Text>
                </View>
              ))}

              {/* impacts */}
              <View style={styles.benefitSection}>
                {materialGuide.environmentalImpact && (
                  <>
                    <Text style={[styles.benefitTitle, { color: colors.text }]}>1. Environmental Impact</Text>
                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{materialGuide.environmentalImpact}</Text>
                  </>
                )}
                {materialGuide.economicImpact && (
                  <>
                    <Text style={[styles.benefitTitle, { color: colors.text }]}>2. Economic Efficiency</Text>
                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{materialGuide.economicImpact}</Text>
                  </>
                )}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.tint }]}
                onPress={() => navigation.navigate('GuideDetail', { guide: materialGuide })}
              >
                <Text style={styles.ctaText}>View Guidelines</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
      <Text style={{ fontSize: 17, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 }}>
        Please select a guide from the Home screen carousel.
      </Text>
    </SafeAreaView>
  );
}

// ...styles (no change needed, colors overridden above)


/* ───────────────────── styles (same visual language) ─────────── */
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  greenTop: {
    height: 300,
    backgroundColor: '#1A691A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: { position: 'absolute', top: 50, left: 20 },
  backArrow:  { fontSize: 22, color: '#fff' },
  earthLogo:  { width: 275, height: 265, resizeMode: 'contain', position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -137.5 }, { translateY: -132.5 }] },

  contentContainer: { marginTop: -30 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 60 },

  headerContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  materialTitle:   { flex: 1, fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginRight: 10 },

  containerTagBox:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  containerTagText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  bulletRow: { flexDirection: 'row', marginBottom: 8 },
  bullet:    { marginRight: 8, fontSize: 16, lineHeight: 22 },
  stepText:  { fontSize: 14, color: '#333', flex: 1 },

  benefitSection: { marginTop: 24 },
  benefitTitle:   { fontWeight: '700', fontSize: 16, marginTop: 10 },
  benefitText:    { fontSize: 14, color: '#555', lineHeight: 22 },

  ctaButton: { backgroundColor: '#15803d', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 32, elevation: 3 },
  ctaText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  
});
