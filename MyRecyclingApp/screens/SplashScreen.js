import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation();

  const logoPosition = useRef(new Animated.Value(-200)).current;
  const bgColor = useRef(new Animated.Value(0)).current;

 useEffect(() => {
  Animated.sequence([
    // Step 1: Slide in the logo (background stays white)
    Animated.timing(logoPosition, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: true,
    }),
    // Step 2: Change background from white to green after logo is in place
    Animated.timing(bgColor, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }),
    // Step 3: Wait 1.5 seconds before navigating away
    Animated.delay(1500),
  ]).start(() => {
    navigation.replace('Onboarding');
  });
}, []);


  const interpolateBackground = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#4CAF50'], // from white to green  5F9E00 
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: interpolateBackground }]}>
      <Animated.Image
        source={require('../assets/logo1.png')} // update this with your logo path
        style={[styles.logo, { transform: [{ translateY: logoPosition }] }]}
        resizeMode="contain"
      />
      
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.5,
    height: height * 0.2,
    marginBottom: 20,
    tintColor: '#264E29'
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginTop: 10,
  },
});
