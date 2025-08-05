import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';

export default function CongratulationsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Checkmark image at top */}
      <Image
        source={require('../assets/success.png')}
        style={styles.checkmark}
        resizeMode="contain"
      />

      {/* Congratulations illustration 
      <Image
        source={require('../assets/Congratulations.png')}
        style={styles.congratsImage}
        resizeMode="contain"
      />
        */}
      {/* Texts */}
      <Text style={styles.title}>🎉 Congratulations! 🎉</Text>
      <Text style={styles.message}>Your email has been successfully verified.</Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FEED',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkmark: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  congratsImage: {
    width: '80%',
    height: 220,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
