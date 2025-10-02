// src/screens/Client/EditProfileClient.js

import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TextInput, Alert, 
    ActivityIndicator, Image, TouchableOpacity, StatusBar, Platform 
} from 'react-native';
import { supabase } from '../../api/Supabase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// --- COMPONENTES INTERNOS ---

const FormInput = ({ label, value, onChangeText, placeholder, ...props }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={`${COLORS.primary}80`}
            {...props}
        />
    </View>
);

const PrimaryButton = ({ title, onPress, disabled, loading, icon }) => (
    <TouchableOpacity style={[styles.button, styles.primaryButton, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
        {loading ? (
            <ActivityIndicator color={COLORS.primary} />
        ) : (
            <>
                <Ionicons name={icon} size={20} color={COLORS.primary} />
                <Text style={[styles.buttonText, styles.primaryButtonText]}>{title}</Text>
            </>
        )}
    </TouchableOpacity>
);

const SecondaryButton = ({ title, onPress, disabled, icon, color = COLORS.primary }) => (
    <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onPress} disabled={disabled}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.buttonText, styles.secondaryButtonText, {color: color}]}>{title}</Text>
    </TouchableOpacity>
);

// --- PANTALLA PRINCIPAL ---

export default function EditProfileClient({ route, navigation }) {
    const { profile: initialProfile } = route.params;

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        if (initialProfile) {
            setName(initialProfile.name || '');
            setPhone(initialProfile.phone_number || '');
            setAddress(initialProfile.address || '');
            setAvatarUrl(initialProfile.avatar_url || null);
            setEmergencyName(initialProfile.emergency_name || '');
            setEmergencyPhone(initialProfile.emergency_phone || '');
        }
    }, [initialProfile]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos necesarios', 'Se requieren permisos para acceder a la galería.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets[0].uri) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri) => {
        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado.");

            const response = await fetch(uri);
            const blob = await response.blob();
            const fileExt = uri.split('.').pop();
            const filePath = `${user.id}.${fileExt}`;

            const { error } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
            if (error) throw error;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error) {
            Alert.alert('Error', 'No se pudo subir la imagen.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay un usuario logueado.");

            // ----- CORRECCIÓN AQUÍ -----
            const updates = {
                id: user.id,
                name: name.trim(),
                phone_number: phone,
                address,
                emergency_name: emergencyName,
                emergency_phone: emergencyPhone,
                avatar_url: avatarUrl,
                role_id: initialProfile.role_id, // Se asegura de que el role_id no se pierda
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            Alert.alert("Éxito", "Perfil guardado correctamente.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", `No se pudo guardar el perfil: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={styles.headerButton} /> 
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        <Image 
                            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/Perrito_blanco.png')}
                            style={styles.avatar} 
                        />
                        {uploading && (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator color={COLORS.white} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage} disabled={uploading}>
                        <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.changePhotoButtonText}>Cambiar Foto</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    <FormInput label="Nombre(s) y Apellido(s)" value={name} onChangeText={setName} placeholder="Tu nombre completo" />
                    <FormInput label="Email" value={initialProfile?.email || ''} editable={false} />
                    <FormInput label="Teléfono" value={phone} onChangeText={setPhone} placeholder="Tu número de teléfono" keyboardType="phone-pad" />
                    <FormInput label="Dirección" value={address} onChangeText={setAddress} placeholder="Tu dirección" />
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
                    <FormInput label="Nombre del Contacto" value={emergencyName} onChangeText={setEmergencyName} placeholder="Nombre completo" />
                    <FormInput label="Teléfono del Contacto" value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Número de teléfono" keyboardType="phone-pad" />
                </View>

                <View style={styles.actionButtons}>
                    <SecondaryButton title="Cancelar" onPress={() => navigation.goBack()} icon="close-outline" color={COLORS.secondary}/>
                    <PrimaryButton title="Guardar" onPress={handleSave} disabled={saving || uploading} loading={saving} icon="save-outline" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 15,
    },
    headerButton: {
        width: 30,
    },
    headerTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h2,
        color: COLORS.textPrimary,
    },
    scrollContent: {
        paddingBottom: 40,
        backgroundColor: COLORS.primary,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.secondary,
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginTop: 15,
    },
    changePhotoButtonText: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
        marginLeft: 8,
    },
    formSection: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.textPrimary,
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 14,
        color: COLORS.secondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.secondary,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 16,
        color: COLORS.primary,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        flex: 1,
    },
    primaryButton: {
        backgroundColor: COLORS.accent,
        marginLeft: 10,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.secondary,
    },
    buttonText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: 16,
        marginLeft: 10,
    },
    primaryButtonText: {
        color: COLORS.primary,
    },
    secondaryButtonText: {
        color: COLORS.secondary,
    },
    buttonDisabled: {
        backgroundColor: `${COLORS.accent}80`,
    },
});