import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingItem({ label, isSwitch, value, onValueChange, onPress, icon, danger }) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={styles.labelWrap}>
        <Ionicons name={icon} size={20} color={danger ? '#dc2626' : '#4CAF50'} />
        <Text style={[styles.label, danger && { color: '#dc2626' }]}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch value={value} onValueChange={onValueChange} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#aaa" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
});
