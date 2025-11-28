import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize } from '../../utils/helpers';
import moment from 'moment';

export default function AdminNuevaCita({ navigation, route }) {
    const { petId: routePetId, ownerId: routeOwnerId } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [pets, setPets] = useState([]);
    const [vets, setVets] = useState([]);

    const [selectedClient, setSelectedClient] = useState(routeOwnerId || null);
    const [selectedPet, setSelectedPet] = useState(routePetId || null);
    const [selectedVet, setSelectedVet] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        loadClients();
        loadVets();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            loadPetsByClient(selectedClient);
        } else {
            setPets([]);
            setSelectedPet(null);
        }
    }, [selectedClient]);

    const loadClients = async () => {
        try {
            // Obtener ID del rol cliente
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'cliente')
                .single();

            if (roleData) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('role_id', roleData.id)
                    .order('name');

                if (!error) {
                    setClients(data || []);
                }
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadVets = async () => {
        try {
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'veterinario')
                .single();

            if (roleData) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('role_id', roleData.id)
                    .order('name');

                if (!error) {
                    setVets(data || []);
                }
            }
        } catch (error) {
            console.error('Error loading vets:', error);
        }
    };

    const loadPetsByClient = async (clientId) => {
        try {
            const { data, error } = await supabase
                .from('pets')
                .select('id, name, species:species_id(name)')
                .eq('owner_id', clientId)
                .order('name');

            if (!error) {
                setPets(data || []);
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        }
    };

    const handleCreateAppointment = async () => {
        // Validaciones
        if (!selectedClient) {
            Alert.alert('Error', 'Selecciona un cliente');
            return;
        }
        if (!selectedPet) {
            Alert.alert('Error', 'Selecciona una mascota');
            return;
        }
        if (!selectedVet) {
            Alert.alert('Error', 'Selecciona un veterinario');
            return;
        }
        if (!selectedDate) {
            Alert.alert('Error', 'Selecciona una fecha');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Error', 'Ingresa una hora (HH:MM)');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Error', 'Ingresa el motivo de la cita');
            return;
        }

        try {
            setLoading(true);

            // Obtener ID del estado "Pendiente"
            const { data: statusData } = await supabase
                .from('appointment_status')
                .select('id')
                .eq('status', 'Pendiente')
                .single();

            if (!statusData) {
                Alert.alert('Error', 'No se encontró el estado de cita');
                return;
            }

            // Crear appointment_time combinando fecha y hora
            const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;

            const { data: newAppointment, error } = await supabase
                .from('appointments')
                .insert({
                    pet_id: selectedPet,
                    vet_id: selectedVet,
                    appointment_time: appointmentDateTime,
                    reason: reason.trim(),
                    status_id: statusData.id,
                })
                .select()
                .single();

            if (error) throw error;

            // --- CREAR NOTIFICACIONES ---

            // 1. Notificar al Cliente
            await supabase.from('notifications').insert({
                user_id: selectedClient,
                type: 'new_appointment',
                title: 'Nueva Cita Programada',
                content: `Se ha programado una cita para el ${moment(appointmentDateTime).format('DD/MM/YYYY HH:mm')}.`,
                link_id: newAppointment.id
            });

            // 2. Notificar al Veterinario
            await supabase.from('notifications').insert({
                user_id: selectedVet,
                type: 'new_appointment',
                title: 'Nueva Cita Asignada',
                content: `Se te ha asignado una nueva cita para el ${moment(appointmentDateTime).format('DD/MM/YYYY HH:mm')}.`,
                link_id: newAppointment.id
            });

            Alert.alert('Éxito', 'Cita creada y notificaciones enviadas', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Error creating appointment:', error);
            Alert.alert('Error', 'No se pudo crear la cita');
        } finally {
            setLoading(false);
        }
    };

    const markedDates = selectedDate
        ? {
            [selectedDate]: {
                selected: true,
                selectedColor: COLORS.accent,
            },
        }
        : {};

    return (
        <AdminLayout navigation={navigation}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Nueva Cita</Text>

                    {/* Cliente */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Cliente</Text>
                        <View style={styles.pickerContainer}>
                            {clients.map((client) => (
                                <TouchableOpacity
                                    key={client.id}
                                    style={[
                                        styles.optionButton,
                                        selectedClient === client.id && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => setSelectedClient(client.id)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedClient === client.id && styles.optionTextSelected,
                                        ]}
                                    >
                                        {client.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Mascota */}
                    {selectedClient && (
                        <View style={styles.section}>
                            <Text style={styles.label}>Mascota</Text>
                            <View style={styles.pickerContainer}>
                                {pets.length === 0 ? (
                                    <Text style={styles.emptyText}>Este cliente no tiene mascotas</Text>
                                ) : (
                                    pets.map((pet) => (
                                        <TouchableOpacity
                                            key={pet.id}
                                            style={[
                                                styles.optionButton,
                                                selectedPet === pet.id && styles.optionButtonSelected,
                                            ]}
                                            onPress={() => setSelectedPet(pet.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    selectedPet === pet.id && styles.optionTextSelected,
                                                ]}
                                            >
                                                {pet.name} ({pet.species?.name || 'N/A'})
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    )}

                    {/* Veterinario */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Veterinario</Text>
                        <View style={styles.pickerContainer}>
                            {vets.map((vet) => (
                                <TouchableOpacity
                                    key={vet.id}
                                    style={[
                                        styles.optionButton,
                                        selectedVet === vet.id && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => setSelectedVet(vet.id)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedVet === vet.id && styles.optionTextSelected,
                                        ]}
                                    >
                                        {vet.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Calendario */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Fecha</Text>
                        <Calendar
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                            markedDates={markedDates}
                            minDate={moment().format('YYYY-MM-DD')}
                            theme={{
                                selectedDayBackgroundColor: COLORS.accent,
                                todayTextColor: COLORS.accent,
                                arrowColor: COLORS.accent,
                            }}
                        />
                        {selectedDate && (
                            <Text style={styles.selectedText}>
                                Fecha seleccionada: {moment(selectedDate).format('DD/MM/YYYY')}
                            </Text>
                        )}
                    </View>

                    {/* Hora */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Hora (HH:MM)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 14:30"
                            placeholderTextColor={COLORS.secondary}
                            value={selectedTime}
                            onChangeText={setSelectedTime}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>

                    {/* Motivo */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Motivo de la cita</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe el motivo de la consulta..."
                            placeholderTextColor={COLORS.secondary}
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Botón */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleCreateAppointment}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                                <Text style={styles.buttonText}>Crear Cita</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: responsiveSize(20),
    },
    title: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(20),
    },
    section: {
        marginBottom: responsiveSize(20),
    },
    label: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(8),
    },
    pickerContainer: {
        gap: responsiveSize(8),
    },
    optionButton: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(8),
        padding: responsiveSize(12),
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    optionButtonSelected: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent + '15',
    },
    optionText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
    },
    optionTextSelected: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent,
    },
    emptyText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: responsiveSize(20),
    },
    selectedText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent,
        marginTop: responsiveSize(8),
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(8),
        padding: responsiveSize(12),
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
    },
    textArea: {
        height: responsiveSize(100),
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: COLORS.accent,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsiveSize(8),
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.white,
    },
});
