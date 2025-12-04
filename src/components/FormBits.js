import React from 'react';
import { TextInput, Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/theme';

/**
 * DropdownSelect - Selector desplegable estilizado
 */
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

/**
 * UnderlineInput - Input moderno con icono
 */
export function UnderlineInput({ icon, ...props }) {
  return (
    <View style={styles.inputContainer}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={COLORS.card}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        {...props}
        placeholderTextColor={COLORS.primary + '60'}
        style={[
          styles.input,
          icon && styles.inputWithIcon,
          props.style
        ]}
      />
    </View>
  );
}

/**
 * PrimaryButton - Botón principal con degradado visual
 */
export function PrimaryButton({ title, onPress, disabled, loading, style, icon }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { opacity: disabled || loading ? 0.7 : pressed ? 0.9 : 1 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <View style={styles.btnContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.btnTxt}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * SecondaryButton - Botón secundario (outline)
 */
export function SecondaryButton({ title, onPress, disabled, style, icon }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        { opacity: disabled ? 0.7 : pressed ? 0.8 : 1 },
        style
      ]}
    >
      <View style={styles.btnContent}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={COLORS.accent}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={styles.secondaryBtnTxt}>{title}</Text>
      </View>
    </Pressable>
  );
}

/**
 * EyeToggle - Toggle para mostrar/ocultar contraseña
 */
export function EyeToggle({ shown, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={styles.eye}>
      <Ionicons
        name={shown ? 'eye-off-outline' : 'eye-outline'}
        size={22}
        color={COLORS.card}
      />
    </Pressable>
  );
}

/**
 * LinkText - Texto clickeable para navegación
 */
export function LinkText({ children, onPress, style }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.linkText, style]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 4,
    fontSize: 15,
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.primary,
  },
  inputWithIcon: {
    // Estilos adicionales cuando hay icono
  },

  // Picker
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerDisabled: {
    backgroundColor: COLORS.secondary + '20',
    opacity: 0.7,
  },
  picker: {
    height: 52,
    width: '100%',
  },
  placeholderItem: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.primary + '60',
    fontSize: 15,
  },
  pickerItem: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.primary,
    fontSize: 15,
  },

  // Primary Button
  btn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    // Sombra moderna
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.PoppinsBold,
    letterSpacing: 0.5,
  },

  // Secondary Button
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryBtnTxt: {
    color: COLORS.accent,
    fontSize: 15,
    fontFamily: FONTS.PoppinsSemiBold,
  },

  // Eye toggle
  eye: {
    position: 'absolute',
    right: 4,
    top: 10,
    padding: 8,
  },

  // Link text
  linkText: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 14,
    color: COLORS.card,
    textAlign: 'center',
  },
});