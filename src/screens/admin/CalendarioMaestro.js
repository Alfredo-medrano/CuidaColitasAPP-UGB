import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize } from '../../utils/helpers';
import moment from 'moment';

export default function CalendarioMaestro({ navigation }) {
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState({});

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          id,
          appointment_time,
          reason,
          pet:pet_id(name, owner:owner_id(name)),
          vet:vet_id(name),
         status:status_id(status)
        `)
                .order('appointment_time', { ascending: true });

            if (error) throw error;

            setAppointments(data || []);
            generateMarkedDates(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            Alert.alert('Error', 'No se pudieron cargar las citas');
        } finally {
            setLoading(false);
        }
    };

    const generateMarkedDates = (appts) => {
        const marked = {};

        appts.forEach((apt) => {
            const date = moment(apt.appointment_time).format('YYYY-MM-DD');

            if (!marked[date]) {
                marked[date] = {
                    marked: true,
                    dotColor: COLORS.accent,
                };
            }
        });

        // Marca el día seleccionado
        const currentSelected = selectedDate;
        if (marked[currentSelected]) {
            marked[currentSelected] = {
                ...marked[currentSelected],
                selected: true,
                selectedColor: COLORS.card,
            };
        } else {
            marked[currentSelected] = {
                selected: true,
                selectedColor: COLORS.card,
            };
        }

        setMarkedDates(marked);
    };

    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);

        // Actualizar marked dates
        const newMarked = { ...markedDates };

        // Remover selección anterior
        Object.keys(newMarked).forEach(key => {
            if (newMarked[key].selected) {
                delete newMarked[key].selected;
                delete newMarked[key].selectedColor;
            }
        });

        // Agregar nueva selección
        if (newMarked[day.dateString]) {
            newMarked[day.dateString] = {
                ...newMarked[day.dateString],
                selected: true,
                selectedColor: COLORS.card,
            };
        } else {
            newMarked[day.dateString] = {
                selected: true,
                selectedColor: COLORS.card,
            };
        }

        setMarkedDates(newMarked);
    };

    const handleCancelAppointment = async (appointmentId) => {
        Alert.alert(
            'Cancelar Cita',
            '¿Estás seguro de que deseas cancelar esta cita?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Obtener ID del estado "Cancelada"
                            const { data: statusData } = await supabase
                                .from('appointment_status')
                                .select('id')
                                .eq('status', 'Cancelada')
                                .single();

                            if (!statusData) {
                                Alert.alert('Error', 'No se encontró el estado cancelado');
                                return;
                            }

                            const { error } = await supabase
                                .from('appointments')
                                .update({ status_id: statusData.id })
                                .eq('id', appointmentId);

                            if (error) throw error;

                            Alert.alert('Éxito', 'Cita cancelada');
                            fetchAppointments();
                        } catch (error) {
                            console.error('Error canceling appointment:', error);
                            Alert.alert('Error', 'No se pudo cancelar la cita');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmada':
            case 'Completada':
                return COLORS.accent;
            case 'Pendiente':
            case 'Programada':
                return '#F59E0B';
            case 'Cancelada':
                return COLORS.red;
            default:
                return COLORS.secondary;
        }
    };

    const filteredAppointments = appointments.filter((apt) =>
        moment(apt.appointment_time).format('YYYY-MM-DD') === selectedDate
    );

    const renderAppointmentCard = (apt) => {
        const statusColor = getStatusColor(apt.status?.status);

        return (
            <View key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentTime}>
                        <Ionicons name="time-outline" size={16} color={COLORS.accent} />
                        <Text style={styles.timeText}>
                            {moment(apt.appointment_time).format('HH:mm')}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {apt.status?.status || 'Desconocido'}
                        </Text>
                    </View>
                </View>

                <View style={styles.appointmentBody}>
                    <View style={styles.infoRow}>
                        <Ionicons name="paw" size={16} color={COLORS.black + 'AA'} />
                        <Text style={styles.infoText}>{apt.pet?.name || 'Mascota'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color={COLORS.black + 'AA'} />
                        <Text style={styles.infoText}>
                            {apt.pet?.owner?.name || 'Dueño'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="medical-outline" size={16} color={COLORS.black + 'AA'} />
                        <Text style={styles.infoText}>Dr. {apt.vet?.name || 'Veterinario'}</Text>
                    </View>

                    {apt.reason && (
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={16} color={COLORS.black + 'AA'} />
                            <Text style={styles.infoText} numberOfLines={2}>
                                {apt.reason}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.appointmentActions}>
                    {apt.status?.status !== 'Cancelada' && apt.status?.status !== 'Completada' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleCancelAppointment(apt.id)}
                        >
                            <Ionicons name="close-circle" size={18} color={COLORS.red} />
                            <Text style={[styles.actionText, { color: COLORS.red }]}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Calendario Maestro</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AdminNuevaCita')}
                >
                    <Ionicons name="add-circle" size={24} color={COLORS.accent} />
                    <Text style={styles.addButtonText}>Nueva Cita</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Calendar
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: COLORS.white,
                            calendarBackground: COLORS.white,
                            selectedDayBackgroundColor: COLORS.card,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.accent,
                            dayTextColor: COLORS.black,
                            textDisabledColor: COLORS.secondary,
                            dotColor: COLORS.accent,
                            selectedDotColor: COLORS.white,
                            arrowColor: COLORS.accent,
                            monthTextColor: COLORS.black,
                            textDayFontFamily: FONTS.PoppinsRegular,
                            textMonthFontFamily: FONTS.PoppinsSemiBold,
                            textDayHeaderFontFamily: FONTS.PoppinsSemiBold,
                        }}
                    />

                    <View style={styles.appointmentsSection}>
                        <Text style={styles.sectionTitle}>
                            Citas del {moment(selectedDate).format('DD/MM/YYYY')}
                        </Text>

                        {filteredAppointments.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="calendar-outline" size={48} color={COLORS.secondary} />
                                <Text style={styles.emptyText}>No hay citas para este día</Text>
                            </View>
                        ) : (
                            filteredAppointments.map(renderAppointmentCard)
                        )}
                    </View>
                </ScrollView>
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveSize(20),
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.textPrimary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: responsiveSize(12),
        paddingVertical: responsiveSize(8),
        borderRadius: responsiveSize(8),
        gap: responsiveSize(4),
    },
    addButtonText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveSize(40),
    },
    scrollContent: {
        paddingBottom: responsiveSize(20),
    },
    appointmentsSection: {
        marginTop: responsiveSize(20),
    },
    sectionTitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(12),
    },
    appointmentCard: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        marginBottom: responsiveSize(12),
        ...SHADOWS.medium,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveSize(12),
        paddingBottom: responsiveSize(12),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary + '30',
    },
    appointmentTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(6),
    },
    timeText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
    },
    statusBadge: {
        paddingHorizontal: responsiveSize(10),
        paddingVertical: responsiveSize(4),
        borderRadius: responsiveSize(12),
    },
    statusText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsSemiBold,
    },
    appointmentBody: {
        gap: responsiveSize(8),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(8),
    },
    infoText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
        flex: 1,
    },
    appointmentActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: responsiveSize(12),
        gap: responsiveSize(8),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: responsiveSize(12),
        paddingVertical: responsiveSize(6),
        borderRadius: responsiveSize(8),
        gap: responsiveSize(4),
    },
    cancelButton: {
        backgroundColor: COLORS.red + '15',
    },
    actionText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsSemiBold,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: responsiveSize(40),
    },
    emptyText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        marginTop: responsiveSize(12),
    },
});
