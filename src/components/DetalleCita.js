import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

export default function DetalleCita({ navigation, route }) {
    const { appointmentId, userRole } = route.params;
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchAppointmentDetails = useCallback(async () => {
        if (!appointmentId) {
            Alert.alert("Error", "ID de cita no válido.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_time,
                    reason,
                    pet:pets ( name ),
                    client:profiles!client_id ( name ),
                    vet:profiles!vet_id ( name ),
                    status:appointment_status ( status )
                `)
                .eq('id', appointmentId)
                .single();
            
            if (error) throw error;
            setAppointment(data);
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el detalle de la cita.");
            console.error("Error al cargar cita:", error.message);
        } finally {
            setLoading(false);
        }
    }, [appointmentId]);

    useEffect(() => {
        if (isFocused) {
            fetchAppointmentDetails();
        }
    }, [isFocused, fetchAppointmentDetails]);

    const handleCancelAppointment = () => {
        Alert.alert(
            "Confirmar Cancelación",
            "¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { data: statusData, error: statusError } = await supabase
                                .from('appointment_status')
                                .select('id')
                                .eq('status', 'Cancelada')
                                .single();
                            
                            if (statusError) throw statusError;

                            const { error: updateError } = await supabase
                                .from('appointments')
                                .update({ status_id: statusData.id })
                                .eq('id', appointmentId);

                            if (updateError) throw updateError;
                            
                            Alert.alert("Éxito", "La cita ha sido cancelada.");
                            navigation.goBack(); 
                        } catch (error) {
                            Alert.alert("Error", "No se pudo cancelar la cita. Intenta de nuevo.");
                            console.error("Error al cancelar:", error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReschedule = () => {
        if (appointment && appointment.id) {
            navigation.navigate('ReprogramarCita', { appointmentId: appointment.id });
        } else {
            Alert.alert("Error", "No se puede reprogramar. Inténtalo de nuevo.");
        }
    };

    if (loading || !appointment) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#43C0AF" />
                <Text style={styles.loadingText}>Cargando detalles de la cita...</Text>
            </View>
        );
    }
    
    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Confirmada': return { backgroundColor: '#d4edda', color: '#155724' };
            case 'Pendiente':
            case 'Programada': return { backgroundColor: '#fff3cd', color: '#856404' };
            case 'Cancelada': return { backgroundColor: '#f8d7da', color: '#721c24' };
            case 'Completada': return { backgroundColor: '#cce5ff', color: '#004085' };
            default: return { backgroundColor: '#e9ecef', color: '#495057' };
        }
    };

    const statusStyle = getStatusBadgeStyle(appointment.status.status);
    const isPastAppointment = moment(appointment.appointment_time).isBefore(moment());
    const isCancellable = !isPastAppointment && appointment.status.status !== 'Cancelada';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#fff" /></Pressable>
                <Text style={styles.headerTitle}>Detalle de Cita</Text>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.petName}>{appointment.pet.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>{appointment.status.status}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="calendar-alt" size={16} color="#666" style={styles.iconMargin} />
                        <Text style={styles.infoText}>{moment(appointment.appointment_time).format('dddd, D [de] MMMM [a las] LT')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="user-md" size={16} color="#666" style={styles.iconMargin} />
                        <Text style={styles.infoText}>Veterinario: {appointment.vet.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="user" size={16} color="#666" style={styles.iconMargin} />
                        <Text style={styles.infoText}>Cliente: {appointment.client.name}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Motivo de la Cita</Text>
                    <Text style={styles.reasonText}>{appointment.reason || 'No especificado.'}</Text>
                </View>

                {isCancellable && (
                    <View style={styles.actionButtons}>
                        {/* BOTÓN REPROGRAMAR - SÓLO VISIBLE SI LA CITA ESTÁ CARGADA */}
                        {appointment && appointment.id && (
                            <Pressable style={styles.rescheduleButton} onPress={handleReschedule}>
                                <Icon name="redo" size={16} color="#fff" style={styles.iconMargin} />
                                <Text style={styles.buttonText}>Reprogramar</Text>
                            </Pressable>
                        )}
                        <Pressable style={styles.cancelButton} onPress={handleCancelAppointment}>
                            <Icon name="times" size={16} color="#fff" style={styles.iconMargin} />
                            <Text style={styles.buttonText}>Cancelar Cita</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#013847' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2ECED' },
    loadingText: { color: '#013847', marginTop: 15 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    content: { flex: 1, backgroundColor: '#E2ECED', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#013847' },
    petName: { fontSize: 20, fontWeight: 'bold', color: '#013847' },
    statusBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoText: { fontSize: 16, color: '#333' },
    iconMargin: { marginRight: 10 },
    reasonText: { fontSize: 16, color: '#555', lineHeight: 24 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
    button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12 },
    rescheduleButton: { backgroundColor: '#DAA520' },
    cancelButton: { backgroundColor: '#dc3545' },
    confirmButton: { backgroundColor: '#28a745' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});