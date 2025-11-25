import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const PetCard = ({ pet }) => (
    <View style={styles.petCard}>
        <View style={styles.petIconContainer}>
            <Ionicons name="paw" size={24} color={COLORS.accent} />
        </View>
        <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petDetail}>{pet.species?.name || 'Especie desc.'} - {pet.breed || 'Raza desc.'}</Text>
            <Text style={styles.petDetail}>{pet.age ? `${pet.age} años` : 'Edad desc.'} - {pet.weight_kg ? `${pet.weight_kg} kg` : 'Peso desc.'}</Text>
        </View>
    </View>
);

export default function DetalleCliente({ route, navigation }) {
    const { clientId } = route.params;
    const [client, setClient] = useState(null);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientDetails();
    }, []);

    const fetchClientDetails = async () => {
        try {
            // 1. Obtener datos del perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', clientId)
                .single();

            if (profileError) throw profileError;
            setClient(profileData);

            // 2. Obtener mascotas
            const { data: petsData, error: petsError } = await supabase
                .from('pets')
                .select('*, species:species_id(name)')
                .eq('owner_id', clientId);

            if (petsError) throw petsError;
            setPets(petsData || []);

        } catch (error) {
            console.error('Error fetching details:', error);
            Alert.alert('Error', 'No se pudieron cargar los detalles del cliente.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header con botón atrás */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle del Cliente</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Información del Cliente */}
            <View style={styles.section}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={40} color={COLORS.white} />
                    </View>
                    <Text style={styles.clientName}>{client?.name || 'Sin Nombre'}</Text>
                    <Text style={styles.clientRole}>Cliente Registrado</Text>
                </View>

                <View style={styles.infoCard}>
                    <InfoRow icon="mail-outline" label="Email" value={client?.email || 'No disponible'} />
                    <InfoRow icon="call-outline" label="Teléfono" value={client?.phone_number || 'No disponible'} />
                    <InfoRow icon="location-outline" label="Dirección" value={client?.address || 'No registrada'} />
                    <InfoRow
                        icon="calendar-outline"
                        label="Miembro desde"
                        value={client?.created_at ? new Date(client.created_at).toLocaleDateString() : 'Desconocido'}
                    />
                </View>
            </View>

            {/* Mascotas */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mascotas ({pets.length})</Text>
                {pets.length > 0 ? (
                    pets.map(pet => <PetCard key={pet.id} pet={pet} />)
                ) : (
                    <Text style={styles.emptyText}>Este cliente no tiene mascotas registradas.</Text>
                )}
            </View>

        </ScrollView>
    );
}

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={20} color={COLORS.accent} style={styles.infoIcon} />
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: COLORS.white },
    headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.primary },
    backButton: { padding: 5 },

    section: { padding: 20 },

    profileHeader: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    clientName: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.primary, textAlign: 'center' },
    clientRole: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.gray },

    infoCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, elevation: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    infoIcon: { marginRight: 15, width: 20 },
    infoLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.gray },
    infoValue: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 14, color: COLORS.text },

    sectionTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.primary, marginBottom: 15 },

    petCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center', elevation: 1 },
    petIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    petInfo: { flex: 1 },
    petName: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 16, color: COLORS.primary },
    petDetail: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.gray },

    emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.gray, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
});
