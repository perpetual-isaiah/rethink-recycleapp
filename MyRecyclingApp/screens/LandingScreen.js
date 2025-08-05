import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Green Section with Logo */}
      <View style={styles.topSection}>
        <ImageBackground
          source={require('../assets/landing-illustration1.png')}
          style={styles.greenBackground}
          resizeMode="cover"
        >
          <Image
            source={require('../assets/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Wavy divider overlays bottom of green */}
          <Image
            source={require('../assets/wave.png')}
            style={styles.wave}
            resizeMode="cover"
          />
        </ImageBackground>
      </View>

      {/* White Bottom Section with Buttons */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>Explore the app</Text>
        <Text style={styles.subtitle}>Manage your recycling effortlessly</Text>

        

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FEED', //#F4FEED //F9FAFB
  },
  topSection: {
    height: height * 0.5,
  },
  greenBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 200,
    height: 200,
    tintColor: '#264E29'
  },
  wave: {
  width: width,
  height: undefined,          // Let image scale with aspect ratio
  aspectRatio: 375 / 119,      // Adjust this to match your image's actual aspect ratio
  position: 'absolute',
  top: 0,
  zIndex: 2,
  resizeMode: 'cover',        // Make sure it fills its bounds properly
},
  bottomSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4D3E3E', //#1B5E20
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4D3E3E',  //4CAF50
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 40,
  },
  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#9DD549', //#43A047
  },
  signupButton: {
    backgroundColor: '#9DD549', //#49B02D   #43A047
  },
  loginText: {
    color: '#6BB200', // 43A047
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
