import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import SearchBar from '../../components/admin/common/SearchBar';
import UserCard from '../../components/admin/common/UserCard';
import LoadingState from '../../components/admin/common/LoadingState';
import EmptyState from '../../components/admin/common/EmptyState';
import { useAdminData } from '../../hooks/admin/useAdminData';
import { useSearch } from '../../hooks/admin/useSearch';
import { supabase } from '../../api/Supabase';

export default function GestionClientes({ navigation }) {
    const { fetchClients, refreshClients, loading } = useAdminData();
    const [clients, setClients] = useState([]);
    const { query, setQuery, filteredData, clearSearch } = useSearch(clients, ['name', 'email', 'phone_number']);

    useFocusEffect(
        React.useCallback(() => {
            loadClients();
        }, [])
    );

    const loadClients = async () => {
        const data = await fetchClients();
        setClients(data);
    };

    const handleRefresh = async () => {
        const data = await refreshClients();
        setClients(data);
    };

    const handleToggleActive = async (client) => {
        const action = client.is_active === false ? 'reactivar' : 'desactivar';
        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Cliente`,
            `¿Estás seguro de ${action} a ${client.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: client.is_active === false ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.rpc(
                                client.is_active === false ? 'reactivate_user' : 'deactivate_user',
                                { user_id: client.id }
                            );
                            if (error) throw error;
                            Alert.alert('Éxito', `Cliente ${action === 'desactivar' ? 'desactivado' : 'reactivado'} correctamente`);
                            loadClients();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', `No se pudo ${action} el cliente`);
                        }
                    },
                },
            ]
        );
    };

    const handleDelete = (client) => {
        Alert.alert(
            '⚠️ Eliminar Permanentemente',
            `Esta acción BORRARÁ a ${client.name}, sus mascotas y todas las citas asociadas. NO se puede deshacer.\n\n¿Estás completamente seguro?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.rpc('delete_client_permanently', {
                                p_client_id: client.id,
                            });
                            if (error) throw error;
                            Alert.alert('Éxito', 'Cliente eliminado permanentemente');
                            loadClients();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'No se pudo eliminar el cliente: ' + (error.message || 'Error desconocido'));
                        }
                    },
                },
            ]
        );
    };

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Gestión de Clientes</Text>
                <Text style={styles.headerSubtitle}>{clients.length} registrados</Text>
            </View>

            <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por nombre, correo o teléfono..."
                onClear={clearSearch}
            />

            {loading ? (
                <LoadingState type="card" count={6} />
            ) : filteredData.length === 0 ? (
                <EmptyState
                    icon="account-group-outline"
                    title={query ? 'Sin resultados' : 'No hay clientes'}
                    message={query ? 'No se encontraron clientes que coincidan con tu búsqueda' : 'Aún no hay clientes registrados'}
                />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <UserCard
                            user={item}
                            variant="client"
                            onPress={() => navigation.navigate('DetalleCliente', { clientId: item.id })}
                            actions={[
                                {
                                    icon: item.is_active === false ? 'checkmark-circle-outline' : 'pause-circle-outline',
                                    onPress: () => handleToggleActive(item),
                                    color: item.is_active === false ? '#4CAF50' : '#FF9800',
                                },
                                { icon: 'trash-outline', onPress: () => handleDelete(item), color: '#F44336' },
                            ]}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onRefresh={handleRefresh}
                    refreshing={false}
                />
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    headerContainer: { marginBottom: 20 },
    headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.white },
    headerSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.textPrimary },
});
