import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, TouchableOpacity, StatusBar, FlatList,Platform, Dimensions, } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

//función para obtener tamaños responsivos y proporcionales
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 375; 
const responsiveSize = (size) => (width / guidelineBaseWidth) * size;

//componentes internos 
const InfoRow = ({ icon, text, iconColor = COLORS.primary }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={responsiveSize(22)} color={iconColor} style={styles.infoIcon} />
    <Text style={styles.infoText}>{text || 'No especificado'}</Text>
  </View>
);

const InfoCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const PetListItem = ({ pet }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'En Tratamiento':
                return { backgroundColor: '#CDA37B30', color: COLORS.alert };
            default:
                return { backgroundColor: '#43C0AF30', color: COLORS.accent };
        }
    };
    const statusStyle = getStatusStyle(pet.status);
    const age = pet.birth_date ? `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} años` : 'N/A';

    return (
        <View style={styles.petItem}>
            <View style={styles.petIconContainer}>
                <Ionicons name="paw-outline" size={responsiveSize(24)} color={COLORS.primary} />
            </View>
            <View style={styles.petDetails}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petInfo}>{pet.species?.name || 'N/A'} • {age}</Text>
            </View>
            <View style={[styles.petStatusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                <Text style={[styles.petStatusText, { color: statusStyle.color }]}>{pet.status || 'Saludable'}</Text>
            </View>
        </View>
    );
};

//componente principal de la pantalla de perfil del cliente

export default function ProfileCliente({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Función para obtener el perfil y las mascotas del usuario
  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado');

      const [profileResponse, petsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, phone_number, address, avatar_url, emergency_name, emergency_phone, role_id')
          .eq('id', user.id)
          .single(),
        supabase
          .from('pets')
          .select('id, name, status, birth_date, species:pet_species(name)')
          .eq('owner_id', user.id)
          .order('name', { ascending: true })
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (petsResponse.error) throw petsResponse.error;

      setProfile({ ...profileResponse.data, email: user.email });
      setPets(petsResponse.data || []);

    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el perfil.');
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchProfile();
    }
  }, [isFocused, fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: COLORS.textPrimary }}>No se encontró el perfil.</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={responsiveSize(24)} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mi Perfil</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProfileClient', { profile })} style={styles.editHeaderButton}>
                        <Ionicons name="create-outline" size={responsiveSize(24)} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileIdentity}>
                    {profile.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                            <Ionicons name="person-outline" size={responsiveSize(50)} color={COLORS.primary} />
                        </View>
                    )}
                    <Text style={styles.profileName}>{profile.name || 'Nombre no disponible'}</Text>
                    <Text style={styles.profileRole}>Cliente CuidaColitas</Text>
                </View>

                <InfoCard title="Información Personal">
                    <InfoRow icon="mail-outline" text={profile.email} />
                    <InfoRow icon="call-outline" text={profile.phone_number} />
                    <InfoRow icon="location-outline" text={profile.address} />
                </InfoCard>

                <InfoCard title="Mis Mascotas">
                    {pets.length > 0 ? (
                        <FlatList
                            data={pets}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <PetListItem pet={item} />}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    ) : (
                        <Text style={styles.emptyText}>No tienes mascotas registradas.</Text>
                    )}
                </InfoCard>

                <InfoCard title="Contacto de Emergencia">
                    <InfoRow icon="person-outline" text={profile.emergency_name} />
                    <InfoRow icon="call-outline" text={profile.emergency_phone} />
                </InfoCard>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={responsiveSize(22)} color={COLORS.white} />
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.primary, 
  },
  safeContainer: { 
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    paddingBottom: responsiveSize(40),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSize(20),
    paddingTop: Platform.OS === 'android' ? responsiveSize(20) : responsiveSize(10),
    paddingBottom: responsiveSize(20),
  },
  backButton: {
    padding: responsiveSize(5),
  },
  headerTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(22), 
    color: COLORS.textPrimary,
  },
  editHeaderButton: {
    padding: responsiveSize(5),
  },
  profileIdentity: {
    alignItems: 'center',
    paddingBottom: responsiveSize(20),
  },
  avatar: {
    width: responsiveSize(100),
    height: responsiveSize(100),
    borderRadius: responsiveSize(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize(15),
    backgroundColor: COLORS.secondary,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  profileName: {
    fontFamily: FONTS.PoppinsBold,
    fontSize: responsiveSize(24),
    color: COLORS.textPrimary,
  },
  profileRole: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: responsiveSize(16),
    color: COLORS.secondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: responsiveSize(20),
    marginHorizontal: responsiveSize(20),
    marginBottom: responsiveSize(15),
  },
  cardTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(18),
    color: COLORS.primary,
    marginBottom: responsiveSize(15),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize(12),
  },
  infoIcon: {
    marginRight: responsiveSize(15),
  },
  infoText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: responsiveSize(16),
    color: COLORS.primary,
    flex: 1,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSize(8),
  },
  petIconContainer: {
    backgroundColor: `${COLORS.accent}40`,
    borderRadius: responsiveSize(20),
    width: responsiveSize(40),
    height: responsiveSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  petDetails: {
    flex: 1,
    marginLeft: responsiveSize(15),
  },
  petName: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(16),
    color: COLORS.primary,
  },
  petInfo: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: responsiveSize(14),
    color: COLORS.card,
  },
  petStatusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  petStatusText: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(12),
  },
  emptyText: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.card,
    textAlign: 'center',
    paddingVertical: 10,
  },
  separator: {
    height: 1,
    backgroundColor: `${COLORS.accent}50`,
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4136',
    borderRadius: 12,
    padding: responsiveSize(15),
    marginHorizontal: responsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveSize(20),
  },
  logoutButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.PoppinsBold,
    fontSize: responsiveSize(16),
    marginLeft: 10,
  },
});