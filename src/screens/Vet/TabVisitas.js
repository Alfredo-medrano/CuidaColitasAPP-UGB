import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';

export default function TabVisitas({ petId, petName, navigation }) {
    const [visits, setVisits] = useState([]);
    const [appointments, setAppointments] = useState([]); // Estado para citas
    const [selectedAppointment, setSelectedAppointment] = useState(null); // Estado para la cita seleccionada
    const [newVisitData, setNewVisitData] = useState({ diagnosis: '', treatment: '', notes: '' }); // Estado para los datos de la nueva visita
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const isFocused = useIsFocused();

    const fetchVisitsAndAppointments = useCallback(async () => {
        try {
            setLoading(true);

            // PASO 1: Obtener el historial de visitas (registros médicos)
            const { data: medicalRecords, error: recordsError } = await supabase
                .from('medical_records')
                .select(`*, appointment:appointments!inner(id, appointment_time, reason, vet_id)`)
                .eq('appointment.pet_id', petId)
                .order('created_at', { ascending: false });

            if (recordsError) throw recordsError;

            // PASO 2: Obtener los detalles del veterinario para cada registro
            if (medicalRecords && medicalRecords.length > 0) {
                const vetIds = [...new Set(medicalRecords.map(rec => rec.appointment.vet_id))];
                const { data: vetsData, error: vetsError } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .in('id', vetIds);

                if (vetsError) throw vetsError;

                const visitsWithVetNames = medicalRecords.map(record => {
                    const vet = vetsData.find(v => v.id === record.appointment.vet_id);
                    return {
                        ...record.appointment,
                        medical_records: [record],
                        vet: vet ? { name: vet.name } : { name: 'N/A' }
                    };
                });
                setVisits(visitsWithVetNames);
            } else {
                setVisits([]);
            }

            // PASO 3: Obtener las citas pendientes de esta mascota
            const { data: pendingAppointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    appointment_time,
                    reason,
                    vet:profiles!vet_id (name)
                `)
                .eq('pet_id', petId)
                .order('appointment_time', { ascending: true });

            if (appointmentsError) throw appointmentsError;
            setAppointments(pendingAppointments);

        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el historial.");
            console.error("Error detallado:", error);
        } finally {
            setLoading(false);
        }
    }, [petId]);

    const handleSaveVisit = async () => {
        if (!selectedAppointment || !newVisitData.diagnosis.trim()) {
            Alert.alert("Error", "Debes seleccionar una cita y añadir un diagnóstico.");
            return;
        }

        setSaving(true);
        try {
            // Obtener el ID del estado 'Completada'
            const { data: statusData, error: statusError } = await supabase
                .from('appointment_status')
                .select('id')
                .eq('status', 'Completada')
                .single();

            if (statusError) throw statusError;

            // Insertar el registro médico
            const { error: recordError } = await supabase
                .from('medical_records')
                .insert({
                    appointment_id: selectedAppointment.id,
                    diagnosis: newVisitData.diagnosis,
                    treatment: newVisitData.treatment,
                    notes: newVisitData.notes,
                });

            if (recordError) throw recordError;

            // Actualizar el estado de la cita a 'Completada'
            const { error: appointmentError } = await supabase
                .from('appointments')
                .update({ status_id: statusData.id })
                .eq('id', selectedAppointment.id);

            if (appointmentError) throw appointmentError;

            Alert.alert("Éxito", "Visita registrada y cita actualizada.");
            setModalVisible(false);
            setSelectedAppointment(null);
            setNewVisitData({ diagnosis: '', treatment: '', notes: '' });
            fetchVisitsAndAppointments(); // Recargar datos
        } catch (error) {
            Alert.alert("Error", "No se pudo guardar la visita.");
            console.error("Error detallado:", error.message);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchVisitsAndAppointments();
        }
    }, [isFocused, fetchVisitsAndAppointments]);

    if (loading) {
        return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabTitle}>Historial de Visitas</Text>
                <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Icon name="plus" size={14} color="#fff" />
                    <Text style={styles.addButtonText}>Nueva Visita</Text>
                </Pressable>
            </View>
            <FlatList
                data={visits}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.reason || "Consulta General"}</Text>
                            <View style={styles.headerActions}>
                                {item.vet && <View style={styles.vetBadge}><Text style={styles.vetBadgeText}>{item.vet.name.split(' ')[0]}</Text></View>}
                            </View>
                        </View>
                        <Text style={styles.cardDate}>{new Date(item.appointment_time).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                        <Text style={styles.cardInfo}><Text style={styles.bold}>Diagnóstico:</Text> {item.medical_records[0]?.diagnosis || 'N/A'}</Text>
                        <Text style={styles.cardInfo}><Text style={styles.bold}>Tratamiento:</Text> {item.medical_records[0]?.treatment || 'N/A'}</Text>
                        <Text style={styles.cardInfo}><Text style={styles.bold}>Notas:</Text> {item.medical_records[0]?.notes || 'Sin notas.'}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay visitas documentadas.</Text>}
            />

            {/* Modal para seleccionar la cita y crear la visita */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={modalStyles.centeredView}>
                    <View style={modalStyles.modalView}>
                        <Text style={modalStyles.modalTitle}>Crear Nueva Visita</Text>
                        <Pressable onPress={() => setModalVisible(false)} style={modalStyles.closeButton}>
                            <Icon name="times" size={24} color="#013847" />
                        </Pressable>

                        <Text style={modalStyles.label}>1. Selecciona la cita:</Text>
                        <FlatList
                            data={appointments}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[modalStyles.appointmentItem, selectedAppointment?.id === item.id && modalStyles.selectedAppointment]}
                                    onPress={() => setSelectedAppointment(item)}
                                >
                                    <Text style={modalStyles.appointmentText}>{new Date(item.appointment_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} | {new Date(item.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {item.reason}</Text>
                                    <Text style={modalStyles.appointmentVet}>Vet: {item.vet?.name || 'N/A'}</Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={<Text style={modalStyles.emptyListText}>No hay citas pendientes para esta mascota.</Text>}
                        />

                        {selectedAppointment && (
                            <View style={modalStyles.formContainer}>
                                <Text style={modalStyles.label}>2. Escribe el registro:</Text>
                                <TextInput
                                    style={modalStyles.input}
                                    placeholder="Diagnóstico"
                                    value={newVisitData.diagnosis}
                                    onChangeText={text => setNewVisitData({ ...newVisitData, diagnosis: text })}
                                    multiline
                                />
                                <TextInput
                                    style={modalStyles.input}
                                    placeholder="Tratamiento"
                                    value={newVisitData.treatment}
                                    onChangeText={text => setNewVisitData({ ...newVisitData, treatment: text })}
                                    multiline
                                />
                                <TextInput
                                    style={modalStyles.input}
                                    placeholder="Notas adicionales"
                                    value={newVisitData.notes}
                                    onChangeText={text => setNewVisitData({ ...newVisitData, notes: text })}
                                    multiline
                                />
                                <Pressable 
                                    style={modalStyles.saveButton} 
                                    onPress={handleSaveVisit}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.saveButtonText}>Guardar Visita</Text>}
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- Estilos del componente principal ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#013847' },
    tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, paddingTop: 20 },
    tabTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43C0AF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
    addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    vetBadge: { backgroundColor: '#e2d9f3', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 8 },
    vetBadgeText: { color: '#492c7c', fontSize: 12, fontWeight: '500' },
    cardDate: { color: '#666', marginBottom: 10, fontSize: 12 },
    cardInfo: { color: '#333', fontSize: 14, marginBottom: 5, lineHeight: 20 },
    bold: { fontWeight: 'bold' },
    emptyText: { color: '#fff', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});

// --- Estilos del Modal ---
const modalStyles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { backgroundColor: '#E2ECED', borderRadius: 20, padding: 25, width: '90%', maxHeight: '80%', elevation: 5, position: 'relative' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#013847', marginBottom: 15, textAlign: 'center' },
    closeButton: { position: 'absolute', top: 10, right: 15 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#013847', marginTop: 10, marginBottom: 5 },
    appointmentItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
    selectedAppointment: { borderColor: '#43C0AF', borderWidth: 2, backgroundColor: '#f0f9f8' },
    appointmentText: { fontSize: 14, color: '#333', fontWeight: '500' },
    appointmentVet: { fontSize: 12, color: '#666', marginTop: 3 },
    emptyListText: { textAlign: 'center', color: '#666', fontStyle: 'italic' },
    formContainer: { marginTop: 20 },
    input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, minHeight: 45 },
    saveButton: { backgroundColor: '#43C0AF', borderRadius: 20, padding: 12, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});