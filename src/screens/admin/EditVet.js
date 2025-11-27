import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const FormInput = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[styles.input, multiline && styles.multilineInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray}
            multiline={multiline}
            keyboardType={keyboardType}
        />
    </View>
);

export default function EditVet({ route, navigation }) {
    const { vetId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clinics, setClinics] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        college_id: '',
        address: '',
        title: '',
        specialties: '',
        clinic_id: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Cargar datos del veterinario y clínicas en paralelo
            const [vetData, clinicsData] = await Promise.all([
                fetchVetDetails(),
                fetchClinics()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const fetchClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClinics(data || []);
        } catch (error) {
            console.error('Error fetching clinics:', error);
        }
    };

    const fetchVetDetails = async () => {
        try {
            if (!vetId) {
                throw new Error('ID de veterinario no proporcionado');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('name, phone_number, college_id, address, title, specialties, clinic_id')
                .eq('id', vetId)
                .single();

            if (error) throw error;

            setFormData({
                name: data.name || '',
                phone_number: data.phone_number || '',
                college_id: data.college_id || '',
                address: data.address || '',
                title: data.title || '',
                specialties: data.specialties ? data.specialties.join(', ') : '',
                clinic_id: data.clinic_id || null,
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
        // Validaciones básicas
        if (!formData.name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio.');
            return;
        }
        if (!formData.phone_number.trim()) {
            Alert.alert('Error', 'El teléfono es obligatorio.');
            return;
        }
        if (!formData.college_id.trim()) {
            Alert.alert('Error', 'El número de colegiado es obligatorio.');
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
                    name: formData.name.trim(),
                    phone_number: formData.phone_number.trim(),
                    college_id: formData.college_id.trim(),
                    address: formData.address.trim() || null,
                    title: formData.title.trim() || null,
                    specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
                    clinic_id: formData.clinic_id || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', vetId);

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
                <Text style={styles.sectionTitle}>Información Personal</Text>

                <FormInput
                    label="Nombre Completo *"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Ej. Dr. Juan Pérez Gómez"
                />

                <FormInput
                    label="Teléfono *"
                    value={formData.phone_number}
                    onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                    placeholder="Ej. +503 1234 5678"
                    keyboardType="phone-pad"
                />

                <FormInput
                    label="Nº Colegiado *"
                    value={formData.college_id}
                    onChangeText={(text) => setFormData({ ...formData, college_id: text })}
                    placeholder="Ej. COV-28-5678"
                />

                <FormInput
                    label="Dirección"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholder="Ej. Calle Principal #123, Ciudad"
                    multiline
                />

                <Text style={styles.sectionTitle}>Información Profesional</Text>

                <FormInput
                    label="Título/Especialidad"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Ej. Medicina General Veterinaria"
                />

                <FormInput
                    label="Especialidades (separadas por coma)"
                    value={formData.specialties}
                    onChangeText={(text) => setFormData({ ...formData, specialties: text })}
                    placeholder="Ej. Cirugía, Dermatología, Rayos X"
                    multiline
                />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Clínica Asignada</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.clinic_id}
                            onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
                            style={styles.picker}
                        >
                            <Picker.Item label="Sin clínica asignada" value={null} />
                            {clinics.map((clinic) => (
                                <Picker.Item key={clinic.id} label={clinic.name} value={clinic.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </>
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
    sectionTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
        marginTop: 10,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 5,
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
        borderColor: COLORS.lightGray || '#E0E0E0',
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: COLORS.lightGray || '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    saveButton: {
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
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
