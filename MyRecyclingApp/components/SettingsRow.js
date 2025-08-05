// components/SettingsRow.js
import React from 'react';
import { TouchableOpacity, View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsRow({
  label,
  icon,
  isSwitch = false,
  value,
  onValueChange,
  onPress,
  danger = false,
  colors,
}) {
  return (
    <TouchableOpacity
      activeOpacity={isSwitch ? 1 : 0.7}
      onPress={isSwitch ? () => onValueChange(!value) : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: colors.separator,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? '#dc2626' : colors.tint}
          style={{ width: 26 }}
        />
        <Text
          style={{
            fontSize: 16,
            marginLeft: 10,
            color: danger ? '#dc2626' : colors.text,
          }}
        >
          {label}
        </Text>
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: colors.switchTrackFalse,
            true: colors.switchTrackTrue,
          }}
          thumbColor={value ? colors.switchThumbOn : colors.switchThumbOff}
          ios_backgroundColor={colors.switchIosBackground}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.text + '90'} />
      )}
    </TouchableOpacity>
  );
}
