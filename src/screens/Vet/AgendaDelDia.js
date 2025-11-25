import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// Configuración de idioma para el calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

export default function AgendaDelDia({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(moment());
  const isFocused = useIsFocused();

  // Verificar si la fecha seleccionada es hoy o futura (para habilitar "Nueva Cita")
  const isDatePast = useMemo(() => {
    const today = moment().startOf('day');
    const selected = moment(selectedDate).startOf('day');
    return selected.isBefore(today);
  }, [selectedDate]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado");

      // Definir rango del día seleccionado
      const startOfDay = moment(selectedDate).startOf('day').toISOString();
      const endOfDay = moment(selectedDate).endOf('day').toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          reason,
          pet:pets ( name, breed ),
          client:profiles!client_id ( name ),
          status:appointment_status ( status )
        `)
        .eq('vet_id', user.id)
        .gte('appointment_time', startOfDay)
        .lte('appointment_time', endOfDay)
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data);

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las citas.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
    }
  }, [isFocused, fetchAppointments]);

  const handleMonthChange = (month) => {
    setCurrentMonth(moment(month.timestamp));
  };

  const renderItem = ({ item }) => {
    const statusColors = {
      Confirmada: { bg: '#A8E6DC80', text: '#027A74' },
      Programada: { bg: '#FFF4CC', text: '#CDA37B' },
      Pendiente: { bg: '#FFF4CC', text: '#CDA37B' },
      Cancelada: { bg: '#FFD2D2', text: '#D32F2F' },
      Completada: { bg: '#D3E5FF', text: '#004085' },
      Perdida: { bg: '#FFCCCC', text: '#FF0000' },
    };

    const statusStyle = statusColors[item.status.status] || statusColors['Programada'];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetalleCita', { appointmentId: item.id, userRole: 'veterinario' })}
      >
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{moment(item.appointment_time).format('HH:mm')}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.petName}>{item.pet.name}</Text>
          <Text style={styles.ownerText}>Dueño: {item.client.name}</Text>
          <Text style={styles.reasonText}>{item.reason || 'Consulta general'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>

        {/* Botón Nueva Cita (Solo si la fecha no es pasada) */}
        {!isDatePast ? (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NuevaCita')}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Nueva</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} /> // Espaciador para mantener alineación
        )}
      </View>

      <Calendar
        style={styles.calendar}
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={handleMonthChange}
        markingType={'custom'}
        markedDates={{
          [selectedDate]: {
            customStyles: {
              container: {
                backgroundColor: COLORS.primary,
                elevation: 2
              },
              text: {
                color: COLORS.white,
                fontWeight: 'bold'
              }
            }
          }
        }}
        theme={{
          backgroundColor: 'white',
          calendarBackground: 'white',
          textSectionTitleColor: COLORS.card || '#8A8A8A',
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.accent,
          dayTextColor: COLORS.primary,
          monthTextColor: COLORS.primary,
          textDayFontFamily: FONTS.PoppinsRegular,
          textMonthFontFamily: FONTS.PoppinsBold,
          textDayHeaderFontFamily: FONTS.PoppinsSemiBold,
          arrowColor: COLORS.primary,
          textDisabledColor: COLORS.secondary ? `${COLORS.secondary}80` : '#E0E0E0',
        }}
      />

      <Text style={styles.sectionTitle}>Citas para {moment(selectedDate).format('D [de] MMMM')}</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.accent} />
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay citas programadas para este día.</Text>
            </View>
          }
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
  loader: { marginTop: 50 },

  card: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 15, alignItems: 'center' },
  timeContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 15, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.1)', marginRight: 15 },
  timeText: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.primary },

  detailsContainer: { flex: 1 },
  petName: { fontFamily: FONTS.PoppinsBold, fontSize: 16, color: COLORS.primary },
  ownerText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card || '#333', fontSize: 13 },
  reasonText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card || '#333', fontSize: 13, fontStyle: 'italic', marginTop: 2 },

  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 },
  statusText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.secondary, textAlign: 'center' },
});