import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Image, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ClienteHome({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const isFocused = useIsFocused();

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado.');

      // 1. Obtener el perfil del cliente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`id, name, avatar_url, roles(name)`)
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);

      // 2. Obtener las mascotas de ese cliente
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select(`
          id, 
          name, 
          breed, 
          status,
          birth_date,
          primary_vet:profiles!primary_vet_id (name),
          species:pet_species(name)
        `)
        .eq('owner_id', user.id)
        .order('name', { ascending: true });
      if (petsError) throw petsError;
      setPets(petsData || []);

      // 3. Obtener el conteo de próximas citas
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id)
        .gte('appointment_time', new Date().toISOString());
      
      if (countError) throw countError;
      setAppointmentsCount(count || 0);

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos del perfil y las mascotas.");
      console.error('Error en ClienteHome:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchClientData();
    }
  }, [isFocused, fetchClientData]);
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
      console.error('Error al cerrar sesión:', error.message);
    }
  };

  const handleProfilePress = () => navigation.navigate('ProfileCliente');
  const handleMisCitasPress = () => navigation.navigate('MisCitas');
  const handleMisMascotasPress = () => navigation.navigate('MisPacientes');
  const handlePedirCitaPress = () => navigation.navigate('SolicitarCita');
  const handleChatPress = () => navigation.navigate('Mensajes');


  const getStatusStyle = (status) => {
    switch (status) {
      case 'En Tratamiento':
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 'En Revisión':
        return { backgroundColor: '#d1ecf1', color: '#0c5460' };
      default: // Activo o Saludable
        return { backgroundColor: '#d4edda', color: '#155724' };
    }
  };
  
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Edad no registrada';
    const now = new Date();
    const birth = new Date(birthDate);
    const ageInMilliseconds = now.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000));
    return `${ageInYears} años`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#43C0AF" />
        <Text style={styles.loadingText}>Cargando tus datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.headerBackground} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
            <View style={styles.profileCircle}>
              <Icon name="user" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.headerHello}>Hola, {profile?.name?.split(' ')[0] || 'Usuario'}</Text>
            <Text style={styles.headerWelcome}>Bienvenida a CuidaColitas</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')} style={styles.bellContainer}>
            <Icon name="bell" solid size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <Pressable style={[styles.statCard, { backgroundColor: '#7F3F98' }]} onPress={handleMisMascotasPress}>
            <Icon name="paw" size={28} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={styles.statValue}>{pets.length}</Text>
            <Text style={styles.statLabel}>Mis Mascotas</Text>
          </Pressable>
          <Pressable style={[styles.statCard, { backgroundColor: '#DAA520' }]} onPress={handleMisCitasPress}>
            <Icon name="calendar-alt" size={28} color="#fff" style={{ marginBottom: 8 }} />
            <Text style={[styles.statValue, { color: '#212121' }]}>{appointmentsCount}</Text>
            <Text style={[styles.statLabel, { color: '#212121' }]}>Próximas Citas</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Mis Mascotas</Text>
        {pets.length > 0 ? (
          pets.map(pet => (
            <Pressable key={pet.id} style={styles.petCard} onPress={() => navigation.navigate('HistorialMedico', { petId: pet.id, petName: pet.name, ownerName: profile.name, userRole: 'cliente' })}>
              <View style={styles.petIconWrapper}>
                <Icon name="paw" size={24} color="#013847" />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDesc}>
                  {pet.species?.name} • {pet.breed || 'Raza no definida'}, {calculateAge(pet.birth_date)}
                </Text>
                <Text style={styles.petDoctor}>{pet.primary_vet?.name || 'Sin doctor asignado'}</Text>
              </View>
              <View style={[styles.petTag, getStatusStyle(pet.status)]}>
                <Text style={[styles.petTagText, {color: getStatusStyle(pet.status).color}]}>{pet.status}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="dog" size={50} color="#ccc" style={{marginBottom: 10}}/>
            <Text style={styles.emptyText}>No tienes mascotas registradas.</Text>
            <Text style={styles.emptyText}>¡Añade una para empezar!</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#7F3F98' }]} onPress={handleMisMascotasPress}>
            <Icon name="paw" size={28} color="#fff" />
            <Text style={styles.actionText}>Mis Mascotas</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#DAA520' }]} onPress={handleMisCitasPress}>
            <Icon name="calendar-alt" size={28} color="#fff" />
            <Text style={styles.actionText}>Mis Citas</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#5D9CEC' }]} onPress={handleChatPress}>
            <Icon name="comment-dots" size={28} color="#fff" />
            <Text style={styles.actionText}>Chat Veterinario</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#43C0AF' }]} onPress={handlePedirCitaPress}>
            <Icon name="plus" size={28} color="#fff" />
            <Text style={styles.actionText}>Pedir Cita</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02a592ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2ECED' },
  loadingText: { marginTop: 10, color: '#013847' },
  
  headerBackground: { backgroundColor: '#00796B' }, // El color base del header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 27,
    backgroundColor: '#1CEA9B', // Un verde más claro para el círculo
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHello: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerWelcome: {
    color: '#fff',
    fontSize: 15,
    marginTop: 2,
  },
  bellContainer: {
    marginLeft: 12,
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scrollContent: { padding: 20, paddingBottom: 50 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 120,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#013847',
    marginVertical: 16,
  },
  petCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2ECED', // Usamos el color de fondo de la app para que el ícono resalte
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013847',
  },
  petDesc: {
    fontSize: 14,
    color: '#6C6464',
    marginTop: 4,
  },
  petDoctor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A259FF',
    marginTop: 4,
  },
  petInfo: { flex: 1 },
  petTag: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  petTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },

  logoutButton: {
    backgroundColor: '#FF4136',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 3,
    marginTop: 30,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});