// src/screens/Client/MisCitas.js
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { useAppointments } from '../../hooks/useAppointments';

// Configuración del idioma del calendario a español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

// Componente para representar cada tarjeta de cita
const AppointmentCard = ({ appointment, onPress }) => {
  const appointmentTime = moment(appointment?.appointment_time);
  const hasTimePassed = appointmentTime.isBefore(moment());

  let displayStatus = appointment?.status?.status ?? 'Programada';

  // Determinar si la cita está perdida
  if (hasTimePassed && displayStatus !== 'Completada' && displayStatus !== 'Cancelada') {
    displayStatus = 'Perdida';
  }

  const statusColors = {
    Confirmada: { bg: '#A8E6DC80', text: '#027A74' },
    Programada: { bg: '#FFF4CC', text: '#CDA37B' },
    Pendiente: { bg: '#FFF4CC', text: '#CDA37B' },
    Cancelada: { bg: '#FFD2D2', text: '#D32F2F' },
    Completada: { bg: '#D3E5FF', text: '#004085' },
    Perdida: { bg: (COLORS?.lightRed ?? '#FFCCCC'), text: (COLORS?.red ?? '#FF0000') },
  };

  const statusStyle = statusColors[displayStatus] || statusColors['Programada'];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{appointmentTime.format('HH:mm')}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.petName}>{appointment?.pet?.name ?? 'Mascota'}</Text>
        <Text style={styles.reasonText}>{appointment?.reason || 'Consulta General'}</Text>
        <Text style={styles.vetText}>Con Dr. {appointment?.vet?.name ?? 'Por asignar'}</Text>
        <Text style={styles.dateText}>{appointmentTime.format('YYYY-MM-DD')}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>{displayStatus}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function MisCitas({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(moment());
  const isFocused = useIsFocused();

  // Hook estandarizado
  const {
    data: allAppointments,
    isLoading,
    error,
    refetch,
  } = useAppointments(false, currentMonth); // false = cliente

  // Refetch al volver a enfocar la pantalla
  useEffect(() => {
    if (isFocused) {
      refetch(currentMonth);
    }
  }, [isFocused, refetch, currentMonth]);

  // Marcado de fechas en el calendario (a prueba de nulls)
  const markedDates = useMemo(() => {
    if (!Array.isArray(allAppointments)) return {};

    const markings = {};
    const dotColors = {
      Confirmada: { key: 'Confirmada', color: COLORS?.accent ?? '#43C0AF' },
      Programada: { key: 'Pendiente', color: COLORS?.alert ?? '#FFCC00' },
      Pendiente: { key: 'Pendiente', color: COLORS?.alert ?? '#FFCC00' },
      Cancelada: { key: 'Cancelada', color: COLORS?.red ?? '#FF0000' },
      Completada: { key: 'Completada', color: '#004085' },
      Perdida: { key: 'Perdida', color: COLORS?.red ?? '#FF0000' },
    };

    allAppointments.forEach((app) => {
      let statusKey = app?.status?.status ?? 'Programada';
      if (
        moment(app?.appointment_time).isBefore(moment()) &&
        statusKey !== 'Completada' &&
        statusKey !== 'Cancelada'
      ) {
        statusKey = 'Perdida';
      }

      const date = moment(app?.appointment_time).format('YYYY-MM-DD');
      const dot = dotColors[statusKey] || { key: 'otro', color: 'grey' };

      if (markings[date]) {
        if (!markings[date].dots.find((d) => d.key === dot.key)) {
          markings[date].dots.push(dot);
        }
      } else {
        markings[date] = { dots: [dot] };
      }
    });

    // Día seleccionado
    if (markings[selectedDate]) {
      markings[selectedDate].selected = true;
      markings[selectedDate].selectedColor = COLORS?.primary ?? '#013847';
    } else {
      markings[selectedDate] = { selected: true, selectedColor: COLORS?.primary ?? '#013847' };
    }

    return markings;
  }, [allAppointments, selectedDate]);

  // Citas del día seleccionado
  const appointmentsForSelectedDay = useMemo(() => {
    if (!Array.isArray(allAppointments)) return [];
    return allAppointments.filter((app) => moment(app?.appointment_time).isSame(selectedDate, 'day'));
  }, [allAppointments, selectedDate]);

  const handleMonthChange = (month) => {
    setCurrentMonth(moment(month.timestamp));
  };

  // Render según estado (carga/error/vacío/lista)
  const renderContent = () => {
    if (isLoading && (!allAppointments || allAppointments.length === 0)) {
      return <ActivityIndicator style={styles.stateIndicator} size="large" color={COLORS?.accent ?? '#43C0AF'} />;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS?.red ?? '#FF0000'} />
          <Text style={styles.errorTextTitle}>Error de Conexión</Text>
          <Text style={styles.errorTextDetail}>No se pudieron cargar tus citas: {error}</Text>
          <TouchableOpacity onPress={() => refetch(currentMonth)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar Carga</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (appointmentsForSelectedDay.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes citas para este día.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={appointmentsForSelectedDay}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('DetalleCita', { appointmentId: item?.id })}
          />
        )}
        contentContainerStyle={styles.list}
        onRefresh={() => refetch(currentMonth)}
        refreshing={isLoading}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS?.primary ?? '#013847'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS?.textPrimary ?? '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SolicitarCita')}>
          <Ionicons name="add" size={20} color={COLORS?.white ?? '#FFFFFF'} />
          <Text style={styles.addButtonText}>Pedir Cita</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        style={styles.calendar}
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={handleMonthChange}
        markingType={'multi-dot'}
        markedDates={markedDates}
        minDate={moment().format('YYYY-MM-DD')}

        disableAllTouchEventsForDisabledDays={false}
        theme={{
          backgroundColor: 'white',
          calendarBackground: 'white',
          textSectionTitleColor: COLORS?.card ?? '#8A8A8A',
          selectedDayBackgroundColor: COLORS?.primary ?? '#013847',
          selectedDayTextColor: COLORS?.white ?? '#FFFFFF',
          todayTextColor: COLORS?.accent ?? '#43C0AF',
          dayTextColor: COLORS?.primary ?? '#013847',
          monthTextColor: COLORS?.primary ?? '#013847',
          textDayFontFamily: FONTS?.PoppinsRegular,
          textMonthFontFamily: FONTS?.PoppinsBold,
          textDayHeaderFontFamily: FONTS?.PoppinsSemiBold,
          arrowColor: COLORS?.primary ?? '#013847',
          // Atenúa los días que ya pasaron (agrega '80' de opacidad a un HEX válido)
          textDisabledColor: (COLORS?.secondary ? `${COLORS.secondary}80` : '#E0E0E0'),
        }}
      />

      <Text style={styles.sectionTitle}>Citas para {moment(selectedDate).format('YYYY-MM-DD')}</Text>

      <View style={styles.contentContainer}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS?.primary ?? '#013847' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerButton: { width: 40 },
  headerTitle: { fontFamily: FONTS?.PoppinsSemiBold, fontSize: SIZES?.h2 ?? 22, color: COLORS?.textPrimary ?? '#FFFFFF' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS?.accent ?? '#43C0AF', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  addButtonText: { fontFamily: FONTS?.PoppinsSemiBold, color: COLORS?.white ?? '#FFFFFF', marginLeft: 5 },
  calendar: { borderRadius: 16, marginHorizontal: 20, marginTop: 10, elevation: 4, shadowColor: '#000' },
  sectionTitle: { fontFamily: FONTS?.PoppinsSemiBold, fontSize: SIZES?.h3 ?? 18, color: COLORS?.textPrimary ?? '#FFFFFF', paddingHorizontal: 20, marginVertical: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyText: { fontFamily: FONTS?.PoppinsRegular, color: COLORS?.secondary ?? '#7185D8', textAlign: 'center', marginTop: 30 },
  card: { flexDirection: 'row', backgroundColor: COLORS?.secondary ?? '#7185D8', borderRadius: 12, padding: 15, marginBottom: 15, alignItems: 'center' },
  timeContainer: { justifyContent: 'center', alignItems: 'center', paddingRight: 15 },
  timeText: { fontFamily: FONTS?.PoppinsBold, fontSize: 20, color: COLORS?.primary ?? '#013847' },
  detailsContainer: { flex: 1 },
  petName: { fontFamily: FONTS?.PoppinsBold, fontSize: 16, color: COLORS?.primary ?? '#013847' },
  reasonText: { fontFamily: FONTS?.PoppinsRegular, color: COLORS?.card ?? '#8A8A8A', marginVertical: 1 },
  vetText: { fontFamily: FONTS?.PoppinsRegular, color: COLORS?.card ?? '#8A8A8A', fontSize: 13 },
  dateText: { fontFamily: FONTS?.PoppinsRegular, color: COLORS?.card ?? '#8A8A8A', fontSize: 13, marginTop: 1 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 },
  statusText: { fontFamily: FONTS?.PoppinsSemiBold, fontSize: 12 },

  contentContainer: { flex: 1, paddingHorizontal: 0 },
  stateIndicator: { flex: 1, marginTop: 50 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: 'transparent' },
  errorTextTitle: { fontFamily: FONTS?.PoppinsBold, fontSize: SIZES?.h2 ?? 22, color: COLORS?.red ?? '#FF0000', marginVertical: 10 },
  errorTextDetail: { fontFamily: FONTS?.PoppinsRegular, fontSize: SIZES?.body4 ?? 12, color: COLORS?.card ?? '#666', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: COLORS?.accent ?? '#43C0AF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryButtonText: { fontFamily: FONTS?.PoppinsSemiBold, color: COLORS?.white ?? '#FFFFFF', fontSize: SIZES?.body3 ?? 14 },
  emptyContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30 },
});
