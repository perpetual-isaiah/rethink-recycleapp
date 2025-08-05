// temp change

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Swiper from 'react-native-swiper';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const swiperRef = useRef(null);

  const slides = [
    {
      image: require('../assets/onboarding1.png'),
      title: 'Welcome to ReThink',
      subtitle: 'Recycle smarter. Track easier. Make an impact.',
    },
    {
      image: require('../assets/onboarding2.png'),
      title: 'Schedule Pickups',
      subtitle: 'Easily request and manage recycling pickups at your convenience.',
    },
    {
      image: require('../assets/onboarding3.png'),
      title: 'Smart Waste Identification',
      subtitle: 'Instantly identify your waste and get proper disposal instructions with AI.',
    },
  ];

  return (
    <Swiper
      ref={swiperRef}
      loop={false}
      showsPagination={true}
      activeDotColor="#8EC23F"
      scrollEnabled={true}
    >
      {slides.map((slide, index) => (
        <View key={index} style={styles.container}>
          <Image
            source={slide.image}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          {/* Slide 1: Skip (bottom left) + forward arrow (bottom right) */}
          {index === 0 && (
            <>
              <TouchableOpacity
                style={styles.bottomLeftButton}
                onPress={() => navigation.navigate('Loading')}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomRightButton}
                onPress={() => swiperRef.current.scrollBy(1)}
              >
                <Ionicons name="arrow-forward-circle" size={44} color="#8EC23F" />
              </TouchableOpacity>
            </>
          )}

         {/* Slide 2: Back text (bottom left) + forward arrow (bottom right) */}
{index === 1 && (
  <>
    <TouchableOpacity
      style={styles.bottomLeftButton}
      onPress={() => swiperRef.current.scrollBy(-1)}
    >
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.bottomRightButton}
      onPress={() => swiperRef.current.scrollBy(1)}
    >
      <Ionicons name="arrow-forward-circle" size={44} color="#8EC23F" />
    </TouchableOpacity>
  </>
)}


          {/* Slide 3: Get Started button */}
          {index === 2 && (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => navigation.navigate('Loading')}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </Swiper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  bottomLeftButton: {
  position: 'absolute',
  bottom: 80, // increased from 60 to 80 or any value you like
  left: 20,
  zIndex: 10,
},

bottomRightButton: {
  position: 'absolute',
  bottom: 80, // match the left button
  right: 20,
  zIndex: 10,
},
skipButton: {
  position: 'absolute',
  bottom: 80,
  left: 20,
  zIndex: 10,
},
  skipText: {
    fontSize: 18,
    color: '#A0A0A0',
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  getStartedButton: {
  position: 'absolute',
  bottom: 85,
  alignSelf: 'center',
  backgroundColor: '#8EC23F',
  paddingVertical: 15,
  paddingHorizontal: 40,
  borderRadius: 40,
},

  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  backText: {
  fontSize: 18,
  color: '#A0A0A0',
  fontWeight: '600',
  paddingHorizontal: 10,
},

});
