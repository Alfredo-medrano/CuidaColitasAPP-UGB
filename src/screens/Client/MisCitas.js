import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export default function MisCitas({ navigation }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(moment());
    const isFocused = useIsFocused();

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado");

            const startDate = moment(selectedDate).startOf('day').toISOString();
            const endDate = moment(selectedDate).endOf('day').toISOString();

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_time,
                    reason,
                    pet:pets ( name ),
                    vet:profiles!vet_id ( name ),
                    status:appointment_status ( status )
                `)
                .eq('client_id', user.id)
                .gte('appointment_time', startDate)
                .lte('appointment_time', endDate)
                .order('appointment_time', { ascending: true });
            
            if (error) throw error;
            setAppointments(data);

        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar tus citas.");
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

    const onDateSelect = (date) => {
        setSelectedDate(moment(date));
    };
    
    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'Confirmada':
                return { backgroundColor: '#1CEA9B', color: '#fff' };
            case 'Pendiente':
            case 'Programada':
                return { backgroundColor: '#FFB300', color: '#212121' };
            case 'Completada':
                return { backgroundColor: '#cce5ff', color: '#004085' };
            case 'Cancelada':
                return { backgroundColor: '#f8d7da', color: '#721c24' };
            default:
                return { backgroundColor: '#e9ecef', color: '#495057' };
        }
    };

    const renderAppointmentCard = ({ item }) => {
        const statusStyle = getStatusBadgeStyle(item.status.status);
        const appointmentMoment = moment(item.appointment_time);
        
        return (
          <Pressable 
            style={styles.citaCard}
            onPress={() => navigation.navigate('DetalleCita', { appointmentId: item.id, userRole: 'cliente' })}
          >
            <View style={[styles.citaHoraCircle, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.citaHoraText, { color: statusStyle.color }]}>
                {appointmentMoment.format('HH:mm')}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.citaNombre}>{item.pet.name}</Text>
              <Text style={styles.citaMotivo}>{item.reason || 'Consulta General'}</Text>
              <Text style={styles.citaDoctor}>Con Dr. {item.vet.name}</Text>
              <Text style={styles.citaFecha}>{appointmentMoment.format('YYYY-MM-DD')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={[styles.citaEstadoTag, { backgroundColor: statusStyle.backgroundColor }]}>
                <Text style={styles.citaEstadoText}>{item.status.status}</Text>
              </View>
            </View>
          </Pressable>
        );
    };

    const renderCalendar = () => {
      const monthNames = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
      const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
      
      const daysInMonth = getDaysInMonth(selectedDate.year(), selectedDate.month());
      const firstDay = selectedDate.clone().startOf('month').day();
      const rows = [];
      let currentDay = 1 - firstDay;
      for (let week = 0; week < 6; week++) {
          const row = [];
          for (let d = 0; d < 7; d++) {
              row.push(currentDay > 0 && currentDay <= daysInMonth ? currentDay : null);
              currentDay++;
          }
          rows.push(row);
          if (currentDay > daysInMonth) break;
      }

      return (
        <View style={styles.calendarBox}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => onDateSelect(selectedDate.clone().subtract(1, 'month'))}>
              <Ionicons name="chevron-back" size={22} color="#37474F" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {monthNames[selectedDate.month()]} {selectedDate.year()}
            </Text>
            <TouchableOpacity onPress={() => onDateSelect(selectedDate.clone().add(1, 'month'))}>
              <Ionicons name="chevron-forward" size={22} color="#37474F" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarRow}>
            {diasSemana.map((d) => (
              <Text key={d} style={styles.calendarDayName}>{d}</Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.calendarRow}>
              {row.map((day, j) =>
                  day ? (
                      <TouchableOpacity
                          key={j}
                          style={[
                              styles.calendarDay,
                              selectedDate.date() === day && { backgroundColor: '#013847' },
                          ]}
                          onPress={() => onDateSelect(selectedDate.clone().date(day))}
                      >
                          <Text style={[
                              styles.calendarDayText,
                              selectedDate.date() === day && { color: '#fff', fontWeight: 'bold' }
                          ]}>{day}</Text>
                      </TouchableOpacity>
                  ) : (
                      <View key={j} style={styles.calendarDay} />
                  )
              )}
            </View>
          ))}
        </View>
      );
    };

    const listHeader = () => (
      <>
        {renderCalendar()}
        <Text style={styles.sectionTitle}>Próximas Citas</Text>
      </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.headerBackground} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mis Citas</Text>
                    <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('SolicitarCita')}>
                        <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.newBtnText}>Pedir Cita</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {loading ? (
                <ActivityIndicator style={{ flex: 1, backgroundColor: '#E2ECED' }} size="large" color="#43C0AF" />
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointmentCard}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={listHeader}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No tienes citas para este día.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E2ECED' },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },

    headerBackground: { backgroundColor: '#00796B' },
    header: {
        backgroundColor: '#00796B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? 16 : 0,
        paddingBottom: 14,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    newBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1CEA9B',
        borderRadius: 18,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    newBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    calendarBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        margin: 18,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    calendarMonth: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#212121',
        textAlign: 'center',
    },
    calendarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    calendarDayName: {
        color: '#90A4AE',
        fontWeight: 'bold',
        width: 32,
        textAlign: 'center',
        fontSize: 13,
    },
    calendarDay: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    calendarDayText: {
        color: '#212121',
        fontSize: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#37474F',
        marginVertical: 16,
        paddingHorizontal: 18,
    },
    citaCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        marginHorizontal: 18,
    },
    citaHoraCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    citaHoraText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    citaNombre: {
        fontWeight: 'bold',
        fontSize: 17,
        color: '#37474F',
    },
    citaMotivo: {
        color: '#6C6464',
        fontSize: 14,
        marginTop: 2,
    },
    citaDoctor: {
        color: '#90A4AE',
        fontSize: 13,
        marginTop: 2,
    },
    citaFecha: {
        color: '#90A4AE',
        fontSize: 13,
        marginTop: 2,
    },
    citaEstadoTag: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 8,
        alignSelf: 'flex-end',
    },
    citaEstadoText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    list: {
        paddingBottom: 20,
    },
});