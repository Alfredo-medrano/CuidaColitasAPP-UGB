import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';

export default function Profile({ navigation }) {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuario no encontrado");
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              *,
              roles ( name )
            `)
            .eq('id', user.id)
            .single();

          if (error) throw error;
          
          const fullProfile = {
            ...data,
            role: data.roles.name,
            email: user.email,
          };
          setProfile(fullProfile);

        } catch (error) {
          Alert.alert("Error", "No se pudo cargar el perfil.");
          console.error(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#fff" /></View>;
  }
  if (!profile) {
    return <View style={styles.loaderContainer}><Text style={styles.errorText}>No se encontró el perfil.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
            <View style={styles.avatarPlaceholder}>
                <Icon name="stethoscope" size={50} color="#013847" />
            </View>
        )}
        <Text style={styles.name}>{profile.name || 'Nombre no disponible'}</Text>
        <Text style={styles.title}>{profile.title || 'Título no disponible'}</Text>
        {profile.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verificado</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información Personal</Text>
        <View style={styles.infoRow}><Icon name="envelope" size={16} color="#888" /><Text style={styles.infoText}>{profile.email}</Text></View>
        <View style={styles.infoRow}><Icon name="phone" size={16} color="#888" /><Text style={styles.infoText}>{profile.phone_number || 'No especificado'}</Text></View>
        <View style={styles.infoRow}><Icon name="graduation-cap" size={16} color="#888" /><Text style={styles.infoText}>Colegio: {profile.college_id || 'N/A'}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Especialidades</Text>
        <View style={styles.specialtiesContainer}>
          {profile.specialties?.map((spec, index) => (
            <View key={index} style={styles.specialtyTag}><Text style={styles.specialtyText}>{spec}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Biografía</Text>
        <Text style={styles.biographyText}>{profile.biography || 'Sin biografía.'}</Text>
      </View>

      <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditProfile', { profile: profile })}>
        <Icon name="pencil-alt" size={16} color="#013847" />
        <Text style={styles.editButtonText}>Editar Perfil</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#013847' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#013847' },
  errorText: { color: '#fff', fontSize: 18 },
  header: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 16, color: '#d3d3d3', marginTop: 4 },
  verifiedBadge: { backgroundColor: '#43C0AF', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, marginTop: 10 },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: '#555', marginLeft: 15 },
  specialtiesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  specialtyTag: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  specialtyText: { color: '#555' },
  biographyText: { fontSize: 14, color: '#555', lineHeight: 20 },
  editButton: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  editButtonText: { color: '#013847', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  logoutButton: { backgroundColor: '#FF4136', borderRadius: 12, padding: 15, marginHorizontal: 20, alignItems: 'center', marginBottom: 40 },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});