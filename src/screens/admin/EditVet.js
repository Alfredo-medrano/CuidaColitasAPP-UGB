import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const FormInput = ({ label, value, onChangeText, placeholder, multiline = false }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[styles.input, multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray}
            multiline={multiline}
        />
    </View>
);

export default function EditVet({ route, navigation }) {
    const { profileId } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        specialties: '', // Se manejará como string separado por comas para simplificar
    });

    useEffect(() => {
        fetchVetDetails();
    }, []);

    const fetchVetDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('name, phone_number, specialties')
                .eq('id', profileId)
                .single();

            if (error) throw error;

            setFormData({
                name: data.name || '',
                phone_number: data.phone_number || '',
                specialties: data.specialties ? data.specialties.join(', ') : '',
            });
        } catch (error) {
            console.error('Error fetching vet details:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del veterinario.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return;
        }

        setSaving(true);
        try {
            // Convertir especialidades de string a array
            const specialtiesArray = formData.specialties
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone_number: formData.phone_number,
                    specialties: specialtiesArray,
                })
                .eq('id', profileId);

            if (error) throw error;

            Alert.alert('Éxito', 'Veterinario actualizado correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error updating vet:', error);
            Alert.alert('Error', 'No se pudo actualizar el veterinario.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Editar Veterinario</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.card}>
                <FormInput
                    label="Nombre Completo"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Ej. Dr. Juan Pérez"
                />

                <FormInput
                    label="Teléfono"
                    value={formData.phone_number}
                    onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                    placeholder="Ej. +503 1234 5678"
                />

                <FormInput
                    label="Especialidades (separadas por coma)"
                    value={formData.specialties}
                    onChangeText={(text) => setFormData({ ...formData, specialties: text })}
                    placeholder="Ej. Cirugía, Dermatología, Rayos X"
                    multiline
                />

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.primary,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body4,
        color: COLORS.primary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body3,
        color: COLORS.text,
        backgroundColor: '#FAFAFA',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: COLORS.white,
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h4,
    },
});
