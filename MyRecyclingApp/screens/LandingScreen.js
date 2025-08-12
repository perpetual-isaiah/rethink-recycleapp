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
  const year = new Date().getFullYear();

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
        <View style={styles.contentContainer}>
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

        {/* Minimal Footer: logo + short copyright */}
        <View style={styles.footer}>
          <Image
            source={require('../assets/school-logo.png')}
            style={styles.schoolLogo}
            resizeMode="contain"
            accessibilityLabel="UFÜ logo"
          />
           {/*short copyright 
          <Text style={styles.copyrightText}>
            © {year} UFÜ
          </Text>
          */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FEED',
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
    height: undefined,
    aspectRatio: 375 / 119,
    position: 'absolute',
    top: 0,
    zIndex: 2,
    resizeMode: 'cover',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between', // pushes footer to bottom
  },
  contentContainer: {
    paddingTop: 40,
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4D3E3E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4D3E3E',
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
    borderColor: '#9DD549',
  },
  signupButton: {
    backgroundColor: '#9DD549',
  },
  loginText: {
    color: '#6BB200',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',           // side-by-side
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,                         // RN 0.71+; if older, replace with marginRight on logo
  },
  schoolLogo: {
    width: 60,
    height: 60,
    opacity: 0.8,
    // If your RN version doesn't support `gap`, uncomment:
    // marginRight: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#666666',
    opacity: 0.9,
    flexShrink: 1,                  // avoids overflow on small screens
    textAlign: 'center',
  },
});
