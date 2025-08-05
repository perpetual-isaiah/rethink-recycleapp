// components/LoadingLogo.js
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Image } from 'react-native';

export default function LoadingLogo() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Image
      source={require('../assets/logo1.png')} // Make sure the path matches
      style={[styles.logo, { transform: [{ rotate: rotateInterpolate }] }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 100,
    height: 100,
  },
});
