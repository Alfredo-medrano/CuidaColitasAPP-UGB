import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileCliente({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Usuario no encontrado");

                    // 1. Obtener datos del perfil del cliente, incluyendo los contactos de emergencia
                    const { data, error } = await supabase
                        .from('profiles')
                        .select(`
                            id,
                            name,
                            phone_number,
                            address,
                            avatar_url,
                            role_id,
                            emergency_name,
                            emergency_phone,
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

                    // 2. Obtener las mascotas del cliente
                    const { data: petsData, error: petsError } = await supabase
                        .from('pets')
                        .select(`
                            id, 
                            name, 
                            breed, 
                            status,
                            birth_date,
                            species:pet_species (name)
                        `)
                        .eq('owner_id', user.id)
                        .order('name', { ascending: true });

                    if (petsError) throw petsError;
                    setPets(petsData);

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'En Tratamiento':
                return { backgroundColor: '#fff3cd', color: '#856404' };
            case 'En Revisión':
                return { backgroundColor: '#d1ecf1', color: '#0c5460' };
            default:
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
        return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#fff" /></View>;
    }
    if (!profile) {
        return <View style={styles.loaderContainer}><Text style={styles.errorText}>No se encontró el perfil.</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.headerContainer}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={20} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.profileInfoContainer}>
                    <View style={styles.avatarWrapper}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Icon name="user" size={50} color="#43C0AF" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName}>{profile.name || 'Nombre no disponible'}</Text>
                    <Text style={styles.profileRole}>Cliente CuidaColitas</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Información Personal</Text>
                    <View style={styles.infoRow}><Icon name="envelope" size={16} color="#888" /><Text style={styles.infoText}>{profile.email}</Text></View>
                    <View style={styles.infoRow}><Icon name="phone" size={16} color="#888" /><Text style={styles.infoText}>{profile.phone_number || 'No especificado'}</Text></View>
                    <View style={styles.infoRow}><Icon name="map-marker-alt" size={16} color="#888" /><Text style={styles.infoText}>{profile.address || 'No especificado'}</Text></View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Mis Mascotas</Text>
                    {pets.length > 0 ? (
                        pets.map(pet => (
                            <View key={pet.id} style={styles.petItem}>
                                <View style={styles.petItemLeft}>
                                    <Icon name="paw" size={18} color="#013847" style={{ marginRight: 10 }} />
                                    <View>
                                        <Text style={styles.petName}>{pet.name}</Text>
                                        <Text style={styles.petInfo}>{pet.species?.name} • {pet.breed || 'Raza no definida'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.petStatus, getStatusStyle(pet.status)]}>{pet.status}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No tienes mascotas registradas.</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Contacto de Emergencia</Text>
                    {profile.emergency_name && profile.emergency_phone ? (
                        <>
                            <View style={styles.infoRow}>
                                <Icon name="user-circle" size={16} color="#888" />
                                <Text style={styles.infoText}>{profile.emergency_name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Icon name="phone" size={16} color="#888" />
                                <Text style={styles.infoText}>{profile.emergency_phone}</Text>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.emptyText}>No se ha registrado un contacto de emergencia.</Text>
                    )}
                </View>

                <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditProfileClient', { profile: profile })}>
                    <Icon name="pencil-alt" size={16} color="#fff" />
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                </Pressable>

                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#43C0AF' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    content: { flex: 1, backgroundColor: '#02a592ff' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#43C0AF' },
    errorText: { color: '#fff', fontSize: 18 },
    profileInfoContainer: { alignItems: 'center', paddingVertical: 20 },
    avatarWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    avatar: { width: 120, height: 120, borderRadius: 60 },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 15 },
    profileRole: { fontSize: 16, color: '#d3d3d3' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginHorizontal: 20, marginBottom: 15, elevation: 3 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#013847', marginBottom: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoText: { fontSize: 16, color: '#333', marginLeft: 15 },
    petItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    petItemLeft: { flexDirection: 'row', alignItems: 'center' },
    petName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    petInfo: { fontSize: 14, color: '#666' },
    petStatus: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
    editButton: { flexDirection: 'row', backgroundColor: '#013847', borderRadius: 12, padding: 15, marginHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    logoutButton: { backgroundColor: '#FF4136', borderRadius: 12, padding: 15, marginHorizontal: 20, alignItems: 'center', marginBottom: 40 },
    logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});