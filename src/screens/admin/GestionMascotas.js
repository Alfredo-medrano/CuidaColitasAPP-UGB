import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize, calculateAge } from '../../utils/helpers';

export default function GestionMascotas({ navigation }) {
    const [pets, setPets] = useState([]);
    const [filteredPets, setFilteredPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, dogs: 0, cats: 0, others: 0 });

    useEffect(() => {
        fetchPets();
    }, []);

    useEffect(() => {
        filterPets();
    }, [searchQuery, pets]);

    const fetchPets = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('pets')
                .select(`
          id,
          name,
          breed,
          birth_date,
          weight_kg,
          sex,
          species:species_id(id, name),
          owner:owner_id(id, name, phone_number)
        `)
                .order('name', { ascending: true });

            if (error) throw error;

            setPets(data || []);

            // Calcular estadísticas
            const total = data?.length || 0;
            const dogs = data?.filter(p => p.species?.name?.toLowerCase().includes('perro')).length || 0;
            const cats = data?.filter(p => p.species?.name?.toLowerCase().includes('gato')).length || 0;
            const others = total - dogs - cats;

            setStats({ total, dogs, cats, others });
        } catch (error) {
            console.error('Error fetching pets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterPets = () => {
        if (!searchQuery.trim()) {
            setFilteredPets(pets);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = pets.filter(pet =>
            pet.name?.toLowerCase().includes(query) ||
            pet.breed?.toLowerCase().includes(query) ||
            pet.species?.name?.toLowerCase().includes(query) ||
            pet.owner?.name?.toLowerCase().includes(query)
        );

        setFilteredPets(filtered);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPets();
    };

    const renderPetCard = ({ item }) => (
        <TouchableOpacity
            style={styles.petCard}
            activeOpacity={0.7}
            onPress={() => {
                // Navegar a detalle del cliente para ver la mascota
                navigation.navigate('DetalleCliente', { clientId: item.owner.id });
            }}
        >
            <View style={styles.petIcon}>
                <Ionicons
                    name={item.species?.name?.toLowerCase().includes('perro') ? 'paw' : 'fish'}
                    size={28}
                    color={COLORS.accent}
                />
            </View>

            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petDetail}>
                    {item.species?.name || 'N/A'} • {item.breed || 'Raza desc.'}
                </Text>
                <Text style={styles.petDetail}>
                    {item.birth_date ? calculateAge(item.birth_date) : 'Edad desc.'} • {item.weight_kg ? `${item.weight_kg} kg` : 'Peso desc.'}
                </Text>
                <View style={styles.ownerRow}>
                    <Ionicons name="person-outline" size={12} color={COLORS.secondary} />
                    <Text style={styles.ownerText}>{item.owner?.name || 'Dueño desconocido'}</Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={64} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>No hay mascotas registradas</Text>
            <Text style={styles.emptyText}>
                Las mascotas aparecerán aquí cuando los clientes las registren
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View>
            {/* Estadísticas */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.dogs}</Text>
                    <Text style={styles.statLabel}>Perros</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.cats}</Text>
                    <Text style={styles.statLabel}>Gatos</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.others}</Text>
                    <Text style={styles.statLabel}>Otros</Text>
                </View>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.secondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, raza, especie o dueño"
                    placeholderTextColor={COLORS.secondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.secondary} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.resultsText}>
                {filteredPets.length} mascota{filteredPets.length !== 1 ? 's' : ''} encontrada{filteredPets.length !== 1 ? 's' : ''}
            </Text>
        </View>
    );

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Gestión de Mascotas</Text>
                <Text style={styles.headerSubtitle}>Vista global del sistema</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={filteredPets}
                    renderItem={renderPetCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.accent}
                            colors={[COLORS.accent]}
                        />
                    }
                />
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: responsiveSize(20),
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(4),
    },
    headerSubtitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: responsiveSize(16),
    },
    statBox: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(12),
        alignItems: 'center',
        flex: 1,
        marginHorizontal: responsiveSize(4),
        ...SHADOWS.light,
    },
    statNumber: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.accent,
    },
    statLabel: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveSize(12),
        marginBottom: responsiveSize(12),
        ...SHADOWS.light,
    },
    searchInput: {
        flex: 1,
        marginLeft: responsiveSize(8),
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
    },
    resultsText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(12),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveSize(40),
    },
    listContent: {
        paddingBottom: responsiveSize(20),
    },
    petCard: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        marginBottom: responsiveSize(12),
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    petIcon: {
        width: responsiveSize(56),
        height: responsiveSize(56),
        borderRadius: responsiveSize(28),
        backgroundColor: COLORS.accent + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(12),
    },
    petInfo: {
        flex: 1,
    },
    petName: {
        fontSize: SIZES.body + 1,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
        marginBottom: responsiveSize(2),
    },
    petDetail: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'AA',
        marginBottom: responsiveSize(2),
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
        marginTop: responsiveSize(4),
    },
    ownerText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveSize(60),
    },
    emptyTitle: {
        fontSize: SIZES.h3,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginTop: responsiveSize(16),
        marginBottom: responsiveSize(8),
    },
    emptyText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        textAlign: 'center',
        paddingHorizontal: responsiveSize(40),
    },
});
