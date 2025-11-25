import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const AppointmentCard = ({ appointment }) => {
    const statusColor =
        appointment.status?.status === 'Confirmada' ? COLORS.success :
            appointment.status?.status === 'Pendiente' ? COLORS.warning :
                appointment.status?.status === 'Cancelada' ? COLORS.error :
                    COLORS.primary;

    return (
        <View style={[styles.card, { borderLeftColor: statusColor }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.timeText}>
                    {moment(appointment.appointment_time).format('h:mm A')}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {appointment.status?.status || 'Estado desc.'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Ionicons name="paw" size={16} color={COLORS.gray} />
                    <Text style={styles.infoText}>{appointment.pets?.name || 'Mascota'}</Text>
                </View>
                <View style={styles.row}>
                    <Ionicons name="person" size={16} color={COLORS.gray} />
                    <Text style={styles.infoText}>Dueño: {appointment.client?.name || 'Cliente'}</Text>
                </View>
                <View style={styles.row}>
                    <Ionicons name="medkit" size={16} color={COLORS.accent} />
                    <Text style={[styles.infoText, { color: COLORS.accent, fontFamily: FONTS.PoppinsSemiBold }]}>
                        Vet: {appointment.vet?.name || 'No asignado'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default function CalendarioMaestro({ navigation }) {
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [appointments, setAppointments] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchAppointments(selectedDate);
            fetchMonthMarkers(selectedDate);
        }, [selectedDate])
    );

    const fetchAppointments = async (date) => {
        setLoading(true);
        try {
            const startOfDay = moment(date).startOf('day').toISOString();
            const endOfDay = moment(date).endOf('day').toISOString();

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          id,
          appointment_time,
          status:status_id(status),
          pets:pet_id(name),
          client:client_id(name),
          vet:vet_id(name)
        `)
                .gte('appointment_time', startOfDay)
                .lte('appointment_time', endOfDay)
                .order('appointment_time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            Alert.alert('Error', 'No se pudieron cargar las citas.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthMarkers = async (date) => {
        try {
            const startOfMonth = moment(date).startOf('month').toISOString();
            const endOfMonth = moment(date).endOf('month').toISOString();

            const { data, error } = await supabase
                .from('appointments')
                .select('appointment_time')
                .gte('appointment_time', startOfMonth)
                .lte('appointment_time', endOfMonth);

            if (error) throw error;

            const marks = {};
            data.forEach(app => {
                const day = moment(app.appointment_time).format('YYYY-MM-DD');
                marks[day] = { marked: true, dotColor: COLORS.accent };
            });

            // Asegurar que el día seleccionado siempre esté marcado como seleccionado
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: COLORS.primary
            };

            setMarkedDates(marks);
        } catch (error) {
            console.error('Error fetching markers:', error);
        }
    };

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendario Maestro</Text>
                <View style={{ width: 24 }} />
            </View>

            <Calendar
                current={selectedDate}
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                    selectedDayBackgroundColor: COLORS.primary,
                    todayTextColor: COLORS.accent,
                    arrowColor: COLORS.primary,
                    textDayFontFamily: FONTS.PoppinsRegular,
                    textMonthFontFamily: FONTS.PoppinsBold,
                    textDayHeaderFontFamily: FONTS.PoppinsSemiBold,
                }}
            />

            <View style={styles.listContainer}>
                <Text style={styles.listTitle}>
                    Citas del {moment(selectedDate).format('LL')}
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={appointments}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <AppointmentCard appointment={item} />}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No hay citas programadas para este día.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: COLORS.primary,
        paddingTop: 15
    },
    headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.white },
    backButton: { padding: 5 },

    listContainer: { flex: 1, padding: 15 },
    listTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h4, color: COLORS.primary, marginBottom: 10 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    timeText: { fontFamily: FONTS.PoppinsBold, fontSize: 16, color: COLORS.black },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 12 },

    cardBody: { gap: 5 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.text },

    emptyContainer: { alignItems: 'center', marginTop: 30 },
    emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.gray },
});
