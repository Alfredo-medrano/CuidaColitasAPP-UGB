import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from '../../api/Supabase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 
import { useAuth } from '../../context/AuthContext'; 

// --- Componentes Modulares ---
const FormInput = ({ label, value, onChangeText, placeholder, editable = true, ...props }) => {
    const isReadOnly = !editable;
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, isReadOnly && styles.inputReadOnly]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.primary + '80'}
                editable={editable}
                {...props}
            />
        </View>
    );
};

// --- Componente Principal ---

export default function EditProfile({ route, navigation }) {
    const { profile: initialProfile } = route.params;
    const { refetchProfile } = useAuth();
    
    // Estados de Carga
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    
    // Estados del Formulario
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [title, setTitle] = useState('');
    const [phone, setPhone] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [address, setAddress] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [clinicName, setClinicName] = useState('');

    // Carga inicial
    useEffect(() => {
        if (initialProfile) {
            const fullName = initialProfile.name || '';
            const parts = fullName.split(' ');
            if (parts.length > 1) {
                setName(parts[0]);
                setLastName(parts.slice(1).join(' '));
            } else {
                setName(fullName);
                setLastName('');
            }
            
            setTitle(initialProfile.title || 'Medicina General Veterinaria');
            setPhone(initialProfile.phone_number || '+34 911 123 456');
            setCollegeId(initialProfile.college_id || 'COV-28-5678');
            setAddress(initialProfile.address || 'Calle Veterinarios 123, Madrid');
            setAvatarUrl(initialProfile.avatar_url || null);
            setSelectedClinicId(initialProfile.clinic_id);
            setLoadingInitial(false);
        }

        const fetchClinics = async () => {
            const { data, error } = await supabase.from('clinics').select('id, name');
            if (!error) setClinics(data);
        };
        fetchClinics();
    }, [initialProfile]);

    useEffect(() => {
        const currentClinic = clinics.find(c => c.id === selectedClinicId);
        setClinicName(currentClinic?.name || 'Clínica Veterinaria C');
    }, [selectedClinicId, clinics]);
    
    // Lógica para la subida de foto (pickImage, uploadAvatar) sin cambios
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
            const filePath = `avatars/${user.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error) {
            Alert.alert('Error', 'No se pudo subir la imagen.');
        } finally {
            setUploading(false);
        }
    };


    // ⭐️ FUNCIÓN handleSave REFORZADA ⭐️
    const handleSave = async () => {
        // Validación básica
        if (!name.trim() || !lastName.trim() || !phone.trim() || !collegeId.trim()) {
            Alert.alert("Error", "Los campos Nombre, Apellidos, Teléfono y Colegiado son obligatorios.");
            return;
        }
        
        try {
            setSaving(true); 
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay un usuario logueado.");
            
            const updates = {
                id: user.id,
                name: `${name.trim()} ${lastName.trim()}`,
                title,
                phone_number: phone,
                college_id: collegeId,
                address,
                avatar_url: avatarUrl,
                clinic_id: selectedClinicId, 
                role_id: initialProfile?.role_id, // FIX de la violación NOT NULL (ISO 25012)
                updated_at: new Date(),
            };

            // 1. Ejecutar la actualización del perfil
            const { error: saveError } = await supabase.from('profiles').upsert(updates);
            
            if (saveError) {
                // ⭐️ Logging del error de Supabase para depuración ⭐️
                console.error("Supabase Upsert Error:", saveError);
                throw saveError;
            }
            
            // 2. Ejecutar la recarga del perfil de forma no bloqueante si es posible, o aislada
            if (refetchProfile) {
                try {
                    // Esperamos la recarga si está disponible, pero si falla, no bloquea el final
                    await refetchProfile(true); 
                } catch(refetchError) {
                    console.warn("⚠️ Advertencia: Fallo la recarga del perfil global. Continuando.", refetchError);
                }
            }

            Alert.alert("Éxito", "Perfil guardado correctamente.");
            navigation.goBack();

        } catch (error) {
            // ⭐️ Manejo detallado del error capturado ⭐️
            console.error("Critical Save Error (Caught):", error); 
            const errorMessage = error.message || "Un error desconocido ocurrió durante la operación.";
            Alert.alert("Error", `No se pudo guardar el perfil: ${errorMessage}`);
        } finally {
            // ⭐️ ESTO ES LO CRÍTICO: Asegurarse que se ejecuta SIEMPRE para quitar la carga
            console.log("Finalizando operación de guardado. setSaving(false)");
            setSaving(false); 
        }
    };
    
    if (loadingInitial) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* --- SECCIÓN FOTO DE PERFIL --- */}
                <View style={[styles.card, styles.cardAvatar]}>
                    <Text style={styles.cardTitle}>Foto de Perfil</Text>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarWrapper}>
                            <View style={[styles.avatarCircle, { backgroundColor: COLORS.accent }]}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="bandage" size={40} color={COLORS.white} /> 
                                )}
                            </View>
                            {uploading && (
                                <View style={styles.avatarOverlay}>
                                    <ActivityIndicator color={COLORS.white} size="large" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage} disabled={uploading}>
                            <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.changePhotoButtonText}>Cambiar Foto</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- SECCIÓN INFORMACIÓN PROFESIONAL --- */}
                <View style={[styles.card, styles.cardInfo]}>
                    <Text style={styles.cardTitle}>Información Profesional</Text>
                    
                    <View style={styles.row}>
                        <FormInput label="Nombre" value={name} onChangeText={setName} placeholder="Carlos" />
                        <FormInput label="Apellidos" value={lastName} onChangeText={setLastName} placeholder="González Ruiz" />
                    </View>
                    
                    <FormInput 
                        label="Especialidad" 
                        value={title} 
                        onChangeText={setTitle} 
                        placeholder="Medicina General Veterinaria" 
                        />
                        
                    <View style={styles.row}>
                        <FormInput 
                            label="Email" 
                            value={initialProfile?.user?.email || 'carlos.gonzalez@cuidacolitas.com'} 
                            editable={false}
                            />
                        <FormInput 
                            label="Teléfono" 
                            value={phone} 
                            onChangeText={setPhone} 
                            keyboardType="phone-pad"
                            placeholder="+34 911 123 456" 
                        />
                    </View>
                    
                    <View style={styles.row}>
                        <FormInput 
                            label="Nº Colegiado" 
                            value={collegeId} 
                            onChangeText={setCollegeId}
                            placeholder="COV-28-5678" 
                        />
                        <FormInput 
                            label="Clínica" 
                            value={clinicName} 
                            onChangeText={setClinicName}
                            placeholder="Clínica Veterinaria C" 
                            editable={false}
                        />
                    </View>

                    <FormInput 
                        label="Dirección" 
                        value={address} 
                        onChangeText={setAddress} 
                        placeholder="Calle Veterinarios 123, Madrid"
                    />

                </View>

                {/* --- BOTONES DE ACCIÓN --- */}
                <View style={styles.actionButtons}>
                    <Pressable 
                        style={[styles.button, styles.cancelButton]} 
                        onPress={() => navigation.goBack()}
                        disabled={saving || uploading}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </Pressable>
                    <Pressable 
                        style={[styles.button, styles.saveButton, (saving || uploading) && styles.buttonDisabled]} 
                        onPress={handleSave} 
                        disabled={saving || uploading}
                    >
                        {saving ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} style={{marginRight: 10}}/>
                                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                            </>
                        )}
                    </Pressable>
                </View>
                
            </ScrollView>
        </SafeAreaView>
    );
}
// --- ESTILOS --- (SIN CAMBIOS)
const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: COLORS.primary },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        paddingBottom: 15,
        backgroundColor: COLORS.primary,
    },
    headerTitle: { 
        fontFamily: FONTS.PoppinsSemiBold, 
        fontSize: SIZES.h2, 
        color: COLORS.textPrimary 
    },
    scrollContent: { 
        paddingHorizontal: 0,
        paddingVertical: 10,
        paddingBottom: 40,
        backgroundColor: COLORS.secondary, 
        flexGrow: 1,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    cardAvatar: { 
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 0, 
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    cardInfo: {
        marginTop: 0, 
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    cardTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
        marginBottom: 15,
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 15,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    changePhotoButtonText: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
        marginLeft: 8,
        fontSize: SIZES.body,
    },
    inputGroup: {
        flex: 1,
        marginBottom: 10,
    },
    inputLabel: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.card,
        marginBottom: 4,
    },
    input: {
        backgroundColor: COLORS.textPrimary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.secondary,
    },
    inputReadOnly: {
        backgroundColor: COLORS.secondary,
        color: COLORS.primary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
        marginBottom: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 10,
        gap: 15,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        elevation: 3,
    },
    saveButton: {
        backgroundColor: COLORS.accent,
    },
    saveButtonText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
    },
    cancelButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    cancelButtonText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});