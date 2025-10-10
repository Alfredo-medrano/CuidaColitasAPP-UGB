import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, Modal, Alert, ScrollView, 
    ActivityIndicator, TextInput, TouchableOpacity, Platform, StatusBar, FlatList 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../api/Supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

moment.locale('es');

const ModalPicker = ({ label, selectedValue, onSelect, items, icon, placeholder, enabled = true }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedLabel = items.find(item => item.value === selectedValue)?.label || placeholder;

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={[styles.pickerButton, !enabled && styles.disabledInput]} 
                onPress={() => enabled && setModalVisible(true)}
                disabled={!enabled}
            >
                <Text style={styles.pickerButtonText}>{selectedLabel}</Text>
                <Ionicons name={icon} size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Modal transparent={true} visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item.value); setModalVisible(false); }}>
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const DateTimeDisplay = ({ label, value, onPress, icon, format }) => (
    <View style={[styles.inputGroup, { flex: 1 }]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.dateInput} onPress={onPress}>
            <Text style={styles.dateInputText}>{moment(value).format(format)}</Text>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
        </TouchableOpacity>
    </View>
);

export default function SolicitarCita({ navigation }) {
    const [pets, setPets] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

    const consultationTypes = [ { label: 'Control Rutinario', value: 'Control Rutinario' }, { label: 'Revisión', value: 'Revisión' }, { label: 'Vacunación', value: 'Vacunación' }, { label: 'Emergencia', value: 'Emergencia' }, ];

    useEffect(() => {
        const loadPets = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuario no autenticado");
                const { data: petData, error } = await supabase.from('pets').select('id, name, owner_id, primary_vet_id').eq('owner_id', user.id);
                if (error) throw error;
                setPets(petData || []);
            } catch (error) { Alert.alert("Error", "No se pudieron cargar tus mascotas."); } 
            finally { setLoading(false); }
        };
        loadPets();
    }, []);

    useEffect(() => {
        const pet = pets.find(p => p.id === selectedPetId);
        setSelectedPet(pet);
    }, [selectedPetId, pets]);

    const handleSubmit = async () => {
        if (!selectedPetId || !selectedType || !reason.trim()) {
            Alert.alert("Campos requeridos", "Por favor, completa todos los campos del formulario.");
            return;
        }
        if (!selectedPet?.primary_vet_id) {
            Alert.alert("Error", "Tu mascota no tiene un veterinario asignado.");
            return;
        }
        setSaving(true);
        try {
            const { data: { user: clientUser } } = await supabase.auth.getUser();
            const appointmentTime = moment(date).hour(moment(time).hour()).minute(moment(time).minute()).seconds(0).milliseconds(0).toDate();
            const vetId = selectedPet.primary_vet_id;

            const { data: existingAppointments, error: availabilityError } = await supabase.from('appointments').select('id').eq('vet_id', vetId).gte('appointment_time', appointmentTime.toISOString()).lt('appointment_time', moment(appointmentTime).add(30, 'minutes').toISOString());
            if (availabilityError) throw availabilityError;
            if (existingAppointments && existingAppointments.length > 0) {
                Alert.alert("Horario no disponible", "Ya existe una cita en este horario. Por favor, selecciona otro.");
                setSaving(false); return;
            }
            const { data: statusData, error: statusError } = await supabase.from('appointment_status').select('id').eq('status', 'Pendiente').single();
            if (statusError) throw statusError;

            const { data: vetProfileData, error: vetProfileError } = await supabase.from('profiles').select('clinic_id').eq('id', vetId).single();
            if (vetProfileError) throw vetProfileError;
            if (!vetProfileData.clinic_id) {
                Alert.alert("Error", "El veterinario no tiene una clínica asignada.");
                setSaving(false); return;
            }

            const { data: newAppointment, error: insertError } = await supabase.from('appointments').insert({ pet_id: selectedPetId, vet_id: vetId, client_id: clientUser.id, clinic_id: vetProfileData.clinic_id, status_id: statusData.id, appointment_time: appointmentTime.toISOString(), reason: `${selectedType}: ${reason}`, }).select().single();
            if (insertError) throw insertError;

            await supabase.from('notifications').insert({ user_id: vetId, type: 'new_appointment', title: `Nueva solicitud para ${selectedPet.name}`, content: `Cita solicitada para el ${moment(appointmentTime).format('LLL')}.`, link_id: newAppointment.id });

            Alert.alert("Éxito", "Tu solicitud de cita ha sido enviada y está pendiente de aprobación.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message || "No se pudo solicitar la cita.");
        } finally { setSaving(false); }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}><Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Solicitar Cita</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                <View style={styles.formCard}>
                    <ModalPicker label="Mascota" selectedValue={selectedPetId} onSelect={setSelectedPetId} items={pets.map(p => ({ label: p.name, value: p.id }))} icon="chevron-down" placeholder={pets.length > 0 ? "Seleccionar mascota..." : "No tienes mascotas"} enabled={pets.length > 0} />
                    <ModalPicker label="Tipo de Consulta" selectedValue={selectedType} onSelect={setSelectedType} items={consultationTypes} icon="chevron-down" placeholder="Seleccionar tipo..." />
                    <View style={styles.row}>
                        <DateTimeDisplay label="Fecha Preferida" value={date} onPress={() => { setDateTimePickerMode('date'); setDateTimePickerVisible(true); }} icon="calendar-outline" format="DD / MM / YYYY"/>
                        <DateTimeDisplay label="Hora Preferida" value={time} onPress={() => { setDateTimePickerMode('time'); setDateTimePickerVisible(true); }} icon="time-outline" format="HH:mm A"/>
                    </View>
                    <View style={styles.inputGroup}><Text style={styles.label}>Motivo de la Consulta</Text><TextInput style={styles.input} multiline value={reason} onChangeText={setReason} placeholder="Describe brevemente los síntomas..." placeholderTextColor={`${COLORS.primary}80`}/></View>
                </View>

                <View style={styles.infoBox}><Ionicons name="information-circle-outline" size={24} color={COLORS.primary} /><Text style={styles.infoBoxText}>Tu solicitud será revisada para confirmar la disponibilidad.</Text></View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.submitButton, (saving || loading) && {opacity: 0.7}]} onPress={handleSubmit} disabled={saving || loading}>
                        {saving ? <ActivityIndicator color={COLORS.white} /> : ( <><Ionicons name="send-outline" size={20} color={COLORS.white} /><Text style={styles.submitButtonText}>Enviar Solicitud</Text></> )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {isDateTimePickerVisible && (
                <Modal transparent={true} animationType="fade" visible={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.datePickerContainer}>
                            <DateTimePicker 
                                value={dateTimePickerMode === 'date' ? date : time}
                                mode={dateTimePickerMode}
                                display="spinner"
                                is24Hour={false}
                                textColor={COLORS.primary}
                                onChange={(event, selectedValue) => {
                                    if (event.type === 'set' && selectedValue) {
                                        if (dateTimePickerMode === 'date') {
                                            setDate(selectedValue);
                                            setDateTimePickerMode('time'); 
                                        } else {
                                            setTime(selectedValue);
                                        }
                                    }
                                }}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setDateTimePickerVisible(false)}>
                                <Text style={styles.closeButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    headerButton: { width: 30 },
    headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },
    scrollContent: { padding: 20, paddingBottom: 40 },
    formCard: { backgroundColor: COLORS.secondary, borderRadius: 16, padding: 20 },
    inputGroup: { marginBottom: 15 },
    label: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.card, marginBottom: 8 },
    pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 15, height: 50 },
    pickerButtonText: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 15, height: 50, flex: 1 },
    dateInputText: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary },
    input: { backgroundColor: 'white', borderRadius: 10, padding: 15, fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary, height: 100, textAlignVertical: 'top' },
    disabledInput: { backgroundColor: '#E0E0E0' },
    infoBox: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginTop: 20, alignItems: 'center' },
    infoBoxText: { flex: 1, marginLeft: 10, fontFamily: FONTS.PoppinsRegular, color: COLORS.primary },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
    cancelButton: { flex: 0.45, alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: COLORS.white },
    cancelButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.card, fontSize: 16 },
    submitButton: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: COLORS.accent },
    submitButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.white, fontSize: 16, marginLeft: 10 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', borderRadius: 10, paddingVertical: 10, width: '80%', maxHeight: '60%' },
    modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalItemText: { fontFamily: FONTS.PoppinsRegular, fontSize: 18, color: COLORS.primary, textAlign: 'center' },
    datePickerContainer: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, width: '90%', alignItems: 'center' },
    closeButton: { marginTop: 10, padding: 12, alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 20, width: '100%' },
    closeButtonText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 16, color: COLORS.primary },
});