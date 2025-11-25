import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/Supabase';
import AdminLayout from '../../components/admin/AdminLayout';

const ClientCard = ({ client, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={50} color={COLORS.secondary} />
        </View>
        <View style={styles.infoContainer}>
            <Text style={styles.clientName}>{client.name || 'Sin Nombre'}</Text>
            <Text style={styles.clientEmail}>{client.email || 'Sin Email'}</Text>
            <Text style={styles.clientPhone}>{client.phone_number || 'Sin Teléfono'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
    </TouchableOpacity>
);

export default function GestionClientes({ navigation }) {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(useCallback(() => { fetchClients(); }, []));

    const fetchClients = async () => {
        setLoading(true);
        try {
            // 1. Obtener ID del rol 'cliente'
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'cliente')
                .single();

            if (roleError) throw roleError;

            // 2. Obtener perfiles con ese rol
            // Nota: Supabase Auth gestiona el email, pero a veces se guarda en profiles si se configuró así.
            // Si el email está solo en Auth, no podremos buscarlo fácilmente sin una Edge Function o vista segura.
            // Asumiremos que 'profiles' tiene los datos básicos.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role_id', roleData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setClients(data || []);
            setFilteredClients(data || []);
        } catch (error) {
            console.error('Error cargando clientes:', error.message);
            Alert.alert('Error', 'No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const lowerText = text.toLowerCase();
            const filtered = clients.filter(client =>
                (client.name && client.name.toLowerCase().includes(lowerText)) ||
                (client.email && client.email.toLowerCase().includes(lowerText)) ||
                (client.phone_number && client.phone_number.includes(text))
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients(clients);
        }
    };

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Gestión de Clientes</Text>
                <Text style={styles.headerSubtitle}>{clients.length} registrados</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, correo o teléfono..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor={COLORS.gray}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ClientCard
                            client={item}
                            onPress={() => navigation.navigate('DetalleCliente', { clientId: item.id })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No se encontraron clientes.</Text>
                        </View>
                    }
                />
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    headerContainer: { marginBottom: 20 },
    headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.white },
    headerSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.textPrimary },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 50,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body3, color: COLORS.black },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    avatarContainer: { marginRight: 15 },
    infoContainer: { flex: 1 },
    clientName: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h4, color: COLORS.primary },
    clientEmail: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.gray },
    clientPhone: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.gray },

    emptyContainer: { alignItems: 'center', marginTop: 30 },
    emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.white, fontSize: SIZES.body3 },
});
