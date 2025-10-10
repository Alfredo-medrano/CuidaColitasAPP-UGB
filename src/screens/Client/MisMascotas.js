// src/screens/Client/MisMascotas.js

import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TextInput, 
    ActivityIndicator, Alert, TouchableOpacity,
    StatusBar 
} from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// ... (El componente PetCard no cambia)
const PetCard = ({ pet, onPress }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'En Tratamiento':
                return { container: { backgroundColor: '#FFF4CC' }, text: { color: '#CDA37B' } };
            default:
                return { container: { backgroundColor: '#A8E6DC80' }, text: { color: '#027A74' } };
        }
    };
    const statusStyle = getStatusStyle(pet.status);
    const age = pet.birth_date ? `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} años` : 'N/A';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.petIcon}><Ionicons name="paw-outline" size={24} color={COLORS.accent} /></View>
                <View style={styles.petTitle}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.species?.name || 'N/A'} • {pet.breed || 'No especificado'}</Text>
                </View>
                <View style={[styles.statusBadge, statusStyle.container]}>
                    <Text style={[styles.statusText, statusStyle.text]}>{pet.status || 'Saludable'}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.detailText}>Edad: {age}</Text>
                <Text style={styles.detailText}>Peso: {pet.weight_kg || 'N/A'} kg</Text>
                <Text style={styles.detailText}>Veterinario: Dr. {pet.veterinarian?.name.split(' ')[0] || 'No asignado'}</Text>
                <Text style={styles.detailText}>Última visita: 2024-01-12</Text>
            </View>
            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.nextAppointmentLabel}>Próxima Cita</Text>
                    <Text style={styles.nextAppointmentDate}>2024-01-16</Text>
                </View>
                <TouchableOpacity style={styles.historyButton} onPress={onPress}>
                    <Ionicons name="eye-outline" size={20} color={COLORS.white} />
                    <Text style={styles.historyButtonText}>Ver Historial</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


export default function MisMascotas({ navigation }) {
    const [pets, setPets] = useState([]);
    const [filteredPets, setFilteredPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const isFocused = useIsFocused();

    // ... (la lógica de fetch no cambia)
    const fetchPets = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado");
            const { data, error } = await supabase.from('pets').select(`id, name, breed, status, birth_date, weight_kg, species:pet_species (name), veterinarian:profiles!primary_vet_id (name)`).eq('owner_id', user.id).order('name', { ascending: true });
            if (error) throw error;
            setPets(data || []);
            setFilteredPets(data || []);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar tus mascotas.");
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { if (isFocused) { setLoading(true); fetchPets(); } }, [isFocused, fetchPets]);
    useEffect(() => {
        if (searchTerm) {
            const filtered = pets.filter(pet => pet.name.toLowerCase().includes(searchTerm.toLowerCase()));
            setFilteredPets(filtered);
        } else { setFilteredPets(pets); }
    }, [searchTerm, pets]);


    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }

    return (
        // ----- CORRECCIÓN AQUÍ -----
        // SafeAreaView ahora envuelve toda la pantalla y gestionará el padding del notch.
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Mascotas</Text>
                <View style={styles.headerButton} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={22} color={COLORS.primary + '80'} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar mascota..."
                    placeholderTextColor={COLORS.primary + '80'}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            <FlatList
                data={filteredPets}
                renderItem={({ item }) => (
                    <PetCard 
                        pet={item} 
                        onPress={() => navigation.navigate('HistorialMedicoC', { 
                            petId: item.id, 
                            petName: item.name, 
                            petSpecies: item.species?.name || 'Especie no definida' 
                        })}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="paw-outline" size={40} color={COLORS.secondary + '50'} />
                        <Text style={styles.emptyText}>Aún no tienes mascotas registradas.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        // ----- CORRECCIÓN AQUÍ -----
        // Se elimina el paddingTop manual y se usa un padding vertical simple.
        paddingVertical: 10,
    },
    // ... (el resto de los estilos no cambian)
    headerButton: { width: 30 },
    headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 12, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 15 },
    searchInput: { flex: 1, height: 50, fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary, marginLeft: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.secondary, textAlign: 'center', marginTop: 10 },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 15, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', padding: 15, alignItems: 'flex-start' },
    petIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${COLORS.accent}30`, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    petTitle: { flex: 1 },
    petName: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.textPrimary },
    petBreed: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.secondary },
    statusBadge: { borderRadius: 12, paddingVertical: 5, paddingHorizontal: 12 },
    statusText: { fontFamily: FONTS.PoppinsBold, fontSize: 12 },
    cardBody: { paddingHorizontal: 20, paddingBottom: 15 },
    detailText: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.secondary, marginBottom: 4 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${COLORS.primary}90`, padding: 15 },
    nextAppointmentLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.secondary },
    nextAppointmentDate: { fontFamily: FONTS.PoppinsBold, fontSize: 16, color: COLORS.textPrimary },
    historyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15 },
    historyButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.white, marginLeft: 8 },
});