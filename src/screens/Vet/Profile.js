import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useAuth } from '../../context/AuthContext';
// Importamos SOLO lo que existe en theme.js
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 
import { Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

// --- DEFINICIÓN DE ESTILOS FALTANTES (Recreando 'text' y 'radius' localmente) ---

// 1. Estructura de Texto (Reemplaza a 'text')
const TEXT_STYLES = {
    h3: { 
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3, 
    },
    h4: {
        fontFamily: FONTS.PoppinsSemiBold, 
        fontSize: SIZES.h3,
    },
    body: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
    },
    bodyBold: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.body,
    }
};

// 2. Radios de Borde (Reemplaza a 'radius')
const RADIUS = {
    m: 8, // Valor asumido para un borde medio
};

// --- Componentes de UI Internos (Diseño Nuevo) ---

const Header = ({ onEdit }) => (
    <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editButton}>Editar</Text>
        </TouchableOpacity>
    </View>
);

const UserInfoCard = ({ profile }) => {
    const memberSince = profile?.created_at 
        ? new Date(profile.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
          })
        : '...';

    const avatarUrl = profile?.avatar_url || 'https://via.placeholder.com/100';

    return (
        <View style={styles.userInfoCard}>
            <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar} 
            />
            <Text style={styles.userName}>
                {profile?.nombre || 'Cargando...'} {profile?.apellido || ''}
            </Text>
            <Text style={styles.memberSince}>
                {profile?.role ? `Rol: ${profile.role} | ` : ''}Miembro desde {memberSince}
            </Text>
        </View>
    );
};

const MenuItem = ({ icon, label, onPress, isLogout = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIconContainer}>
            <Feather 
                name={icon} 
                size={22} 
                color={isLogout ? COLORS.red : COLORS.primary} 
            />
        </View>
        <Text style={[styles.menuLabel, isLogout && styles.logoutText]}>
            {label}
        </Text>
        {!isLogout && (
            <Feather 
                name="chevron-right" 
                size={22} 
                color={COLORS.card} 
            />
        )}
    </TouchableOpacity>
);

// --- Componente Principal de la Pantalla ---

export default function Profile({ navigation }) {
    const { session } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const getProfile = useCallback(async () => {
        if (!session?.user) return;

        try {
            setLoading(true);
            const { user } = session;
            
            // ==========================================================
            // AQUÍ ESTÁ LA CORRECCIÓN: 'profiles' en lugar de 'perfiles'
            // ==========================================================
            let { data, error, status } = await supabase
                .from('profiles') 
                .select(`
                    *,
                    roles ( name )
                `)
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                const fullProfile = {
                    ...data,
                    // Tu tabla se llama 'profiles', no 'perfiles'
                    // Y la columna de rol se llama 'role_id' en la BD, no 'roles'
                    // Así que ajustamos la consulta para que coincida con tu BD
                    role: data.roles ? data.roles.name : 'Veterinario',
                    email: user.email,
                    nombre: data.name, // Aseguramos que 'nombre' se mapee desde 'name'
                    apellido: '', // Tu BD 'profiles' no tiene 'apellido', solo 'name'
                };
                setProfile(fullProfile);
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session && isFocused) {
            getProfile();
        }
    }, [session, isFocused, getProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading && !profile) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
        >
            <Header onEdit={() => navigation.navigate('EditProfile', { profile: profile })} />
            
            <UserInfoCard profile={profile} />

            <View style={styles.menuGroup}>
                <MenuItem 
                    icon="user" 
                    label="Mi perfil" 
                    onPress={() => navigation.navigate('EditProfile', { profile: profile })} 
                />
                <MenuItem 
                    icon="bell" 
                    label="Notificaciones" 
                    onPress={() => { /* TODO: Navegar a Notificaciones */ }} 
                />
                <MenuItem 
                    icon="credit-card" 
                    label="Método de pago" 
                    onPress={() => { /* TODO: Navegar a Pagos */ }} 
                />
            </View>

            <View style={styles.menuGroup}>
                <MenuItem 
                    icon="help-circle" 
                    label="Soporte" 
                    onPress={() => { /* TODO: Navegar a Soporte */ }} 
                />
                <MenuItem 
                    icon="log-out" 
                    label="Cerrar sesión" 
                    onPress={handleLogout}
                    isLogout={true}
                />
            </View>
            
        </ScrollView>
    );
}

// --- Estilos (Usando TEXT_STYLES y RADIUS locales) ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.secondary, 
    },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.secondary 
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
    },
    headerTitle: {
        ...TEXT_STYLES.h3, 
        color: COLORS.primary, 
    },
    editButton: {
        ...TEXT_STYLES.bodyBold, 
        color: COLORS.primary, 
        fontSize: 16,
    },
    userInfoCard: {
        backgroundColor: COLORS.white, 
        borderRadius: RADIUS.m, 
        padding: 24,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: COLORS.primary, 
    },
    userName: {
        ...TEXT_STYLES.h4, 
        color: COLORS.primary, 
        marginBottom: 4,
    },
    memberSince: {
        ...TEXT_STYLES.body, 
        color: COLORS.card, 
        fontSize: SIZES.caption,
    },
    menuGroup: {
        backgroundColor: COLORS.white, 
        borderRadius: RADIUS.m, 
        marginBottom: 20,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary, 
    },
    menuIconContainer: {
        width: 32,
        alignItems: 'center',
    },
    menuLabel: {
        ...TEXT_STYLES.body, 
        color: COLORS.primary, 
        fontSize: SIZES.h3,
        marginLeft: 16,
        flex: 1,
    },
    logoutText: {
        color: COLORS.red, 
        fontFamily: FONTS.PoppinsBold, 
    }
});