import React from 'react';
import { TextInput, Pressable, Text, StyleSheet } from 'react-native';

export function UnderlineInput(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9AA6AC"
      style={[styles.input, props.style]}
    />
  );
}

export function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.btn, { opacity: disabled ? 0.7 : 1 }]}>
      <Text style={styles.btnTxt}>{loading ? '...' : title}</Text>
    </Pressable>
  );
}

export function EyeToggle({ shown, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={styles.eye}>
      <Text>{shown ? '🙈' : '👁️'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#9AA6AC',
    paddingVertical: 8,
    fontSize: 15,
    color: '#013847',
    marginBottom: 14,
  },
  btn: {
    backgroundColor: '#43C0AF',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 6,
    elevation: 4,
  },
  btnTxt: { color: 'white', fontWeight: '800' },
  eye: { position: 'absolute', right: 4, top: 6, padding: 6 },
});
