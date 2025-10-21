import React from 'react';
import { TextInput, Pressable, Text, StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { COLORS, FONTS } from '../theme/theme'; 

//dropdown selector
export function DropdownSelect({ placeholder, options, selectedValue, onValueChange, style, disabled }) {
    return (
        <View style={[styles.pickerContainer, style, disabled && styles.pickerDisabled]}>
            <Picker
                selectedValue={selectedValue}
                onValueChange={onValueChange}
                style={styles.picker}
                mode="dropdown"
                enabled={!disabled}
                dropdownIconColor={COLORS.primary} 
            >
                <Picker.Item 
                    label={placeholder} 
                    value={null} 
                    enabled={false} 
                    style={styles.placeholderItem} 
                />
                
                {options.map((item, index) => (
                    <Picker.Item 
                        key={index} 
                        label={item.label} 
                        value={item.value} 
                        style={styles.pickerItem}
                    />
                ))}
            </Picker>
        </View>
    );
}

//underline 
export function UnderlineInput(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={COLORS.black + '70' } 
      style={[styles.input, props.style]}
    />
  );
}

//botón primario
export function PrimaryButton({ title, onPress, disabled, loading, style }) {
  return (
    <Pressable 
        onPress={onPress} 
        disabled={disabled} 
        style={[styles.btn, { backgroundColor: COLORS.primary, opacity: disabled ? 0.7 : 1 }, style]} 
    >
      <Text style={[styles.btnTxt, { fontFamily: FONTS.PoppinsBold }]}>{loading ? 'Cargando...' : title}</Text>
    </Pressable>
  );
}

//ver contraseña o ocultarla
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
    borderBottomColor: COLORS.accent,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.primary,
    marginBottom: 14,
  },
  
  pickerContainer: {
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: COLORS.secondary + '50', 
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    marginBottom: 15,
  },
  pickerDisabled: {
    backgroundColor: COLORS.secondary + '10', 
  },
  picker: {
    height: 50,
    width: '100%',
  },
  placeholderItem: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.secondary,
    fontSize: 15,
  },
  pickerItem: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.primary,
    fontSize: 15,
  },

  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  btnTxt: { 
    color: COLORS.white, 
    fontSize: 16,
  },
  
  eye: { 
    position: 'absolute', 
    right: 4, 
    top: 6, 
    padding: 6 
  },
});