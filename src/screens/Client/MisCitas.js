import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, 
    TouchableOpacity, StatusBar 
} from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';


LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// --- COMPONENTE PARA LA TARJETA DE CITA ---
const AppointmentCard = ({ appointment, onPress }) => {
    const statusColors = {
        'Confirmada': { bg: '#A8E6DC80', text: '#027A74' }, // Verde claro
        'Programada': { bg: '#FFF4CC', text: '#CDA37B' }, // Naranja claro
        'Pendiente': { bg: '#FFF4CC', text: '#CDA37B' },   // Naranja claro
        'Cancelada': { bg: '#FFD2D2', text: '#D32F2F' },  // Rojo claro
        'Completada': { bg: '#D3E5FF', text: '#004085' }, // Azul claro
    };
    const statusStyle = statusColors[appointment.status.status] || statusColors['Programada'];

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{moment(appointment.appointment_time).format('HH:mm')}</Text>
            </View>
            <View style={styles.detailsContainer}>
                <Text style={styles.petName}>{appointment.pet.name}</Text>
                <Text style={styles.reasonText}>{appointment.reason || 'Consulta General'}</Text>
                <Text style={styles.vetText}>Con Dr. {appointment.vet.name}</Text>
                <Text style={styles.dateText}>{moment(appointment.appointment_time).format('YYYY-MM-DD')}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{appointment.status.status}</Text>
            </View>
        </TouchableOpacity>
    );
};


export default function MisCitas({ navigation }) {
    const [allAppointments, setAllAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const isFocused = useIsFocused();

    const fetchAppointments = useCallback(async (month) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado");

            const startDate = moment(month).startOf('month').toISOString();
            const endDate = moment(month).endOf('month').toISOString();

            const { data, error } = await supabase.from('appointments').select(`id, appointment_time, reason, pet:pets(name), vet:profiles!vet_id(name), status:appointment_status(status)`).eq('client_id', user.id).gte('appointment_time', startDate).lte('appointment_time', endDate).order('appointment_time', { ascending: true });
            if (error) throw error;
            setAllAppointments(data || []);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar tus citas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (isFocused) { fetchAppointments(currentMonth); } }, [isFocused, fetchAppointments, currentMonth]);

    const markedDates = useMemo(() => {
        const markings = {};
        const dotColors = {
            'Confirmada': {key: 'Confirmada', color: COLORS.accent},
            'Programada': {key: 'Pendiente', color: COLORS.alert},
            'Pendiente': {key: 'Pendiente', color: COLORS.alert},
            'Cancelada': {key: 'Cancelada', color: '#D32F2F'},
            'Completada': {key: 'Completada', color: '#004085'},
        };

        allAppointments.forEach(app => {
            const date = moment(app.appointment_time).format('YYYY-MM-DD');
            const dot = dotColors[app.status.status] || {key: 'otro', color: 'grey'};
            if (markings[date]) {
                if (!markings[date].dots.find(d => d.key === dot.key)) {
                    markings[date].dots.push(dot);
                }
            } else {
                markings[date] = { dots: [dot] };
            }
        });

        if (markings[selectedDate]) {
            markings[selectedDate].selected = true;
        } else {
            markings[selectedDate] = { selected: true, selectedColor: COLORS.primary };
        }
        return markings;
    }, [allAppointments, selectedDate]);

    const appointmentsForSelectedDay = useMemo(() => {
        return allAppointments.filter(app => moment(app.appointment_time).isSame(selectedDate, 'day'));
    }, [allAppointments, selectedDate]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Citas</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SolicitarCita')}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Pedir Cita</Text>
                </TouchableOpacity>
            </View>

            <Calendar
                style={styles.calendar}
                current={selectedDate}
                onDayPress={day => setSelectedDate(day.dateString)}
                onMonthChange={(month) => setCurrentMonth(new Date(month.timestamp))}
                markingType={'multi-dot'}
                markedDates={markedDates}
                theme={{
                    backgroundColor: 'white',
                    calendarBackground: 'white',
                    textSectionTitleColor: COLORS.card,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: COLORS.white,
                    todayTextColor: COLORS.accent,
                    dayTextColor: COLORS.primary,
                    monthTextColor: COLORS.primary,
                    textDayFontFamily: FONTS.PoppinsRegular,
                    textMonthFontFamily: FONTS.PoppinsBold,
                    textDayHeaderFontFamily: FONTS.PoppinsSemiBold,
                    arrowColor: COLORS.primary,
                }}
            />

            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            
            {loading ? ( <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.accent} /> ) 
            : (
                <FlatList
                    data={appointmentsForSelectedDay}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (<AppointmentCard appointment={item} onPress={() => navigation.navigate('DetalleCita', { appointmentId: item.id })} />)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No tienes citas para este día.</Text>}
                />
            )}
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    headerButton: { width: 40 },
    headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
    addButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.white, marginLeft: 5 },
    calendar: { borderRadius: 16, marginHorizontal: 20, marginTop: 10, elevation: 4, shadowColor: '#000' },
    sectionTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.textPrimary, paddingHorizontal: 20, marginVertical: 20 },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.secondary, textAlign: 'center', marginTop: 30 },
    card: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 15, alignItems: 'center' },
    timeContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 15 },
    timeText: { fontFamily: FONTS.PoppinsBold, fontSize: 20, color: COLORS.primary },
    detailsContainer: { flex: 1 },
    petName: { fontFamily: FONTS.PoppinsBold, fontSize: 16, color: COLORS.primary },
    reasonText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, marginVertical: 1 },
    vetText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: 13 },
    dateText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: 13, marginTop: 1 },
    statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 },
    statusText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 12 },
});