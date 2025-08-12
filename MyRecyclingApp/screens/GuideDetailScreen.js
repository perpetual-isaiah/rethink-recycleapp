// screens/GuideDetailScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { CommonActions } from '@react-navigation/native';

// Map guide keys to images for dos and donts tabs
const guideImages = {
  plastic: {
    dos: require('../assets/images/plastic_dos.png'),
    donts: require('../assets/images/plastic_donts.png'),
  },
  glass: {
    dos: require('../assets/images/glass_dos.png'),
    donts: require('../assets/images/glass_donts.png'),
  },
  paper: {
    dos: require('../assets/images/paper_dos.png'),
    donts: require('../assets/images/paper_donts.png'),
  },
  metal: {
    dos: require('../assets/images/metal_dos.png'),
    donts: require('../assets/images/metal_donts.png'),
  },
  carton: {
    dos: require('../assets/images/carton_dos.png'),
    donts: require('../assets/images/carton_donts.png'),
  },
  ewaste: {
    dos: require('../assets/images/ewaste_dos.png'),
    donts: require('../assets/images/ewaste_donts.png'),
  },
  organic: {
    dos: require('../assets/images/organic_dos.png'),
    donts: require('../assets/images/organic_donts.png'),
  },
  batteries: {
    dos: require('../assets/images/batteries_dos.png'),
    donts: require('../assets/images/batteries_donts.png'),
  },
  clothes: {
    dos: require('../assets/images/clothes_dos.png'),
    donts: require('../assets/images/clothes_donts.png'),
  },
  tires: {
    dos: require('../assets/images/tires_dos.png'),
    donts: require('../assets/images/tires_donts.png'),
  },
  construction: {
    dos: require('../assets/images/construction_dos.png'),
    donts: require('../assets/images/construction_donts.png'),
  },
};

export default function GuideDetailScreen({ route, navigation }) {
  const { guide } = route.params;
  const [tab, setTab] = useState('dos');
  const { colors, darkMode } = useTheme();

  const dos = guide.dos || [];
  const donts = guide.donts || [];

  // Tab color backgrounds for dark/light
  const tabBg =
    tab === 'dos'
      ? darkMode ? '#244b2a' : '#A5D6A7'
      : darkMode ? '#4b2424' : '#EF9A9A';


const handleShowOnMap = () => {
  // Navigate to MainApp (BottomTabs) and then to the RecyclingPoints tab
  navigation.navigate('MainApp', {
    screen: 'RecyclingPoints',
    params: { material: guide.key }
  });
};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tabBg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <AntDesign name="arrowleft" size={24} color={darkMode ? colors.tint : '#000'} />
        </TouchableOpacity>

        <Image
          source={
            (guideImages[guide.key] && guideImages[guide.key][tab]) ||
            guideImages.glass[tab]
          }
          style={styles.image}
        />

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              tab === 'dos' && (darkMode ? styles.tabActiveGreenDark : styles.tabActiveGreen),
              {
                backgroundColor:
                  tab === 'dos'
                    ? darkMode ? '#5a9c3a' : '#9CD04C'
                    : darkMode ? colors.card : '#eee',
              },
            ]}
            onPress={() => setTab('dos')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Dos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              tab === 'donts' && (darkMode ? styles.tabActiveRedDark : styles.tabActiveRed),
              {
                backgroundColor:
                  tab === 'donts'
                    ? darkMode ? '#ad3939' : '#E57373'
                    : darkMode ? colors.card : '#eee',
              },
            ]}
            onPress={() => setTab('donts')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Don'ts</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{guide.label || 'Glass'}</Text>

          {(tab === 'dos' ? dos : donts).map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              {tab === 'dos' ? (
                <MaterialCommunityIcons name="recycle" size={20} color={colors.tint} />
              ) : (
                <AntDesign name="closecircle" size={20} color={darkMode ? '#ff8e8e' : '#E08282'} />
              )}
              <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Show point in map */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.9} onPress={handleShowOnMap}>
            <Text style={styles.ctaText}>Show point in map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },
  back: { margin: 16 },
  image: {
    alignSelf: 'center',
    width: 220,
    height: 140,
    resizeMode: 'contain',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  tabActiveGreen: { backgroundColor: '#9CD04C' },
  tabActiveGreenDark: { backgroundColor: '#5a9c3a' },
  tabActiveRed: { backgroundColor: '#E57373' },
  tabActiveRedDark: { backgroundColor: '#ad3939' },
  tabText: { fontWeight: '600' },
  card: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listText: { marginLeft: 10, fontSize: 15, flex: 1 },

  // CTA styles (moved from `s.*`)
  ctaWrap: { paddingHorizontal: 20, marginTop: 8, marginBottom: 24 },
  ctaBtn: {
    backgroundColor: '#8BC34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
