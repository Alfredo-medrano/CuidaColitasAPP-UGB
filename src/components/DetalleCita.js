import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from '../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../theme/theme';

moment.locale('es');

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.infoIcon} />
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

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
                .select(`id, appointment_time, reason, pet:pets(name), client:profiles!client_id(id, name), vet:profiles!vet_id(id, name), status:appointment_status(status)`)
                .eq('id', appointmentId)
                .single();
            
            if (error) throw error;
            setAppointment(data);
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el detalle de la cita.");
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
                            const { data: statusData, error: statusError } = await supabase.from('appointment_status').select('id').eq('status', 'Cancelada').single();
                            if (statusError) throw statusError;

                            const { error: updateError } = await supabase.from('appointments').update({ status_id: statusData.id }).eq('id', appointmentId);
                            if (updateError) throw updateError;
                            
                            const currentUserIsClient = userRole === 'cliente';
                            const recipientId = currentUserIsClient ? appointment.vet.id : appointment.client.id;
                            const cancelledBy = currentUserIsClient ? 'El cliente' : 'El veterinario';

                            await supabase.from('notifications').insert({
                                user_id: recipientId,
                                type: 'appointment_reminder', // Se puede crear un tipo 'appointment_cancelled'
                                title: `Cita para ${appointment.pet.name} cancelada`,
                                content: `${cancelledBy} ha cancelado la cita del ${moment(appointment.appointment_time).format('LLL')}.`,
                                link_id: appointment.id
                            });
                            
                            Alert.alert("Éxito", "La cita ha sido cancelada.");
                            navigation.goBack(); 
                        } catch (error) {
                            Alert.alert("Error", "No se pudo cancelar la cita. Intenta de nuevo.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading || !appointment) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }
    
    const statusColors = {
        'Confirmada': { bg: '#A8E6DC80', text: '#027A74' },
        'Pendiente': { bg: '#FFF4CC', text: '#CDA37B' },
        'Programada': { bg: '#FFF4CC', text: '#CDA37B' },
        'Cancelada': { bg: '#FFD2D2', text: '#D32F2F' },
        'Completada': { bg: '#D3E5FF', text: '#004085' },
    };
    const statusStyle = statusColors[appointment.status.status] || { bg: 'grey', text: 'white' };
    const isCancellable = !moment(appointment.appointment_time).isBefore(moment()) && appointment.status.status !== 'Cancelada' && appointment.status.status !== 'Completada';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Cita</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.petName}>{appointment.pet.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>{appointment.status.status}</Text>
                        </View>
                    </View>
                    <InfoRow icon="calendar-outline" label="Fecha y Hora" value={moment(appointment.appointment_time).format('dddd, D [de] MMMM [a las] HH:mm A')} />
                    <InfoRow icon="person-outline" label={userRole === 'cliente' ? 'Veterinario' : 'Cliente'} value={userRole === 'cliente' ? appointment.vet.name : appointment.client.name} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Motivo de la Cita</Text>
                    <Text style={styles.reasonText}>{appointment.reason || 'No especificado.'}</Text>
                </View>

                {isCancellable && (
                    <View style={styles.actionButtons}>
                        {userRole === 'veterinario' && (
                            <TouchableOpacity style={styles.rescheduleButton} onPress={() => navigation.navigate('ReprogramarCita', { appointmentId: appointment.id })}>
                                <Ionicons name="repeat-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.rescheduleButtonText}>Reprogramar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointment}>
                            <Ionicons name="close-circle-outline" size={20} color={COLORS.white} />
                            <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
    card: { backgroundColor: COLORS.secondary, borderRadius: 16, padding: 20, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: `${COLORS.primary}20`, paddingBottom: 15 },
    petName: { fontFamily: FONTS.PoppinsBold, fontSize: 22, color: COLORS.primary },
    statusBadge: { borderRadius: 12, paddingVertical: 5, paddingHorizontal: 12 },
    statusText: { fontFamily: FONTS.PoppinsBold, fontSize: 12 },
    cardTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.primary, marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
    infoIcon: { marginRight: 15, marginTop: 2 },
    infoLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.card, marginBottom: 2 },
    infoValue: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 16, color: COLORS.primary, flex: 1 },
    reasonText: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary, lineHeight: 24 },
    actionButtons: { marginTop: 20, gap: 15 },
    rescheduleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: COLORS.accent },
    rescheduleButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.primary, fontSize: 16, marginLeft: 10 },
    cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: '#D32F2F' },
    cancelButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.white, fontSize: 16, marginLeft: 10 },
});