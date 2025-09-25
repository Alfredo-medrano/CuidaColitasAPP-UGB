import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';

moment.locale('es');

export default function ReprogramarCita({ navigation, route }) {
    const { appointmentId } = route.params;

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState({ date: false, time: false });
    const [saving, setSaving] = useState(false);
    const isFocused = useIsFocused();

    const fetchAppointmentDetails = async () => {
        if (!appointmentId) {
            Alert.alert("Error", "ID de cita no válido.");
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            // CORRECCIÓN: Traemos vet_id y el nombre del veterinario en una sola consulta
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_time,
                    reason,
                    vet_id,
                    pet:pets ( name ),
                    vet:profiles!vet_id ( name, clinic_id )
                `)
                .eq('id', appointmentId)
                .single();
            
            if (error) throw error;
            setAppointment(data);
            setDate(new Date(data.appointment_time));
            setTime(new Date(data.appointment_time));
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el detalle de la cita para reprogramar.");
            console.error("Error al cargar cita:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchAppointmentDetails();
        }
    }, [isFocused]);
    
    const onChangeDate = (event, selectedDate) => {
        setShowPicker({ ...showPicker, date: false });
        setDate(selectedDate || date);
    };

    const onChangeTime = (event, selectedTime) => {
        setShowPicker({ ...showPicker, time: false });
        setTime(selectedTime || time);
    };

    const handleReschedule = async () => {
        if (!appointment) {
            Alert.alert("Error", "Los datos de la cita no están cargados.");
            return;
        }

        setSaving(true);
        try {
            const newAppointmentTime = moment(date).hour(moment(time).hour()).minute(moment(time).minute()).toDate();
            
            const startOfAppointment = moment(newAppointmentTime).toDate();
            const endOfAppointment = moment(newAppointmentTime).add(30, 'minutes').toDate();
            
            // CORRECCIÓN: Usamos appointment.vet_id para la verificación de disponibilidad
            const { data: existingAppointments, error: availabilityError } = await supabase
                .from('appointments')
                .select('id')
                .eq('vet_id', appointment.vet_id) // Uso directo de vet_id de la tabla appointments
                .gte('appointment_time', startOfAppointment.toISOString())
                .lt('appointment_time', endOfAppointment.toISOString())
                .neq('id', appointment.id);
            
            if (availabilityError) throw availabilityError;
            if (existingAppointments && existingAppointments.length > 0) {
                Alert.alert("Error", "Ya existe una cita agendada en este horario. Por favor, selecciona otro.");
                return;
            }

            const { data: statusData, error: statusError } = await supabase
                .from('appointment_status')
                .select('id')
                .eq('status', 'Programada')
                .single();
            if (statusError || !statusData) { // Agregamos validación
                throw new Error('No se encontró el estado "Programada" en la base de datos.');
            }

            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    appointment_time: newAppointmentTime.toISOString(),
                    status_id: statusData.id,
                })
                .eq('id', appointment.id);

            if (updateError) throw updateError;

            Alert.alert("Éxito", "La cita ha sido reprogramada.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message || "No se pudo reprogramar la cita.");
            console.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !appointment) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#43C0AF" />
                <Text style={styles.loadingText}>Cargando datos de la cita...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
                    <Text style={styles.headerTitle}>Reprogramar Cita</Text>
                    <View style={{width: 20}} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Cita Original</Text>
                    <Text style={styles.label}>Paciente: <Text style={styles.infoText}>{appointment.pet.name}</Text></Text>
                    <Text style={styles.label}>Motivo: <Text style={styles.infoText}>{appointment.reason || 'N/A'}</Text></Text>
                    <Text style={styles.label}>Veterinario: <Text style={styles.infoText}>{appointment.vet.name}</Text></Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Nuevo Horario</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Fecha</Text>
                            <Pressable onPress={() => setShowPicker({ ...showPicker, date: true })}>
                                <TextInput 
                                  style={styles.input} 
                                  editable={false} 
                                  value={moment(date).format('L')}
                                />
                            </Pressable>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Hora</Text>
                            <Pressable onPress={() => setShowPicker({ ...showPicker, time: true })}>
                                <TextInput 
                                  style={styles.input} 
                                  editable={false} 
                                  value={moment(time).format('LT')} 
                                />
                            </Pressable>
                        </View>
                    </View>
                    {showPicker.date && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}
                    {showPicker.time && <DateTimePicker value={time} mode="time" display="default" onChange={onChangeTime} />}
                </View>

                <View style={styles.actionButtons}>
                    <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.saveButton]} onPress={handleReschedule} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Icon name="redo" size={16} color="#fff" style={{marginRight: 10}}/>}
                        <Text style={styles.buttonText}>Reprogramar Cita</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#013847' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#013847' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  infoText: { fontWeight: 'normal', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', color: '#000' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  col: { flex: 1 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20, gap: 10 },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#43C0AF' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});