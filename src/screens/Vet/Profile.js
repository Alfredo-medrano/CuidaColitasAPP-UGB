import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native'; // Añadida Image
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { supabase } from '../../api/Supabase'; // Mantenido por si es necesario
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

// --- Componentes Reutilizables ---

// Fila de Información Profesional
const InfoRow = ({ icon, value }) => (
    <View style={profileStyles.infoRow}>
        <Ionicons name={icon} size={20} color={COLORS.primary} style={profileStyles.infoIcon} />
        <Text style={profileStyles.infoValue}>{value || 'No especificado'}</Text>
    </View>
);

// Tarjeta de Paciente Reciente 
const PatientCard = ({ patientName, ownerName, petType, status }) => {
    
    const statusText = status || 'N/A';
    
    const statusColors = {
        'Tratamiento': { bg: `${COLORS.alert}40`, text: COLORS.primary }, 
        'Postoperatorio': { bg: `${COLORS.red}40`, text: COLORS.red }, 
        'Control rutinario': { bg: `${COLORS.accent}40`, text: COLORS.primary }, 
        'default': { bg: `${COLORS.secondary}40`, text: COLORS.primary }
    };
    
    const { bg, text } = statusColors[statusText] || statusColors['default'];

    return (
        <View style={profileStyles.patientItem}>
            <Ionicons 
                name={petType === 'Gato' ? 'cat' : 'paw'} 
                size={18} 
                color={COLORS.textPrimary} 
                style={{ marginRight: 10 }} 
            />
            <View style={profileStyles.patientDetails}>
                <Text style={profileStyles.patientName}>{patientName}</Text>
                <Text style={profileStyles.patientOwner}>{ownerName}</Text>
            </View>
            <View style={[profileStyles.statusBadge, { backgroundColor: bg }]}>
                <Text style={[profileStyles.statusBadgeText, { color: text }]}>
                    {statusText}
                </Text> 
            </View>
        </View>
    );
};


// --- Componente Principal ---

export default function Profile({ navigation }) {
    // ⭐️ CAMBIO CRÍTICO: Eliminamos el estado local 'profile' para usar el contexto directamente
    const { session, profile: authProfile, signOut, refetchProfile, loading: authLoading } = useAuth(); 
    const isFocused = useIsFocused();
    
    // Mantenemos solo el estado de carga para la recarga manual
    const [loading, setLoading] = useState(false); 

    // Lógica de Recarga al Enfocar (mantiene ISO 25012: Precisión)
    const refreshProfile = useCallback(() => {
        if (refetchProfile) {
            setLoading(true);
            // refetchProfile() es la única fuente que actualiza authProfile
            refetchProfile().finally(() => setLoading(false)); 
        }
    }, [refetchProfile]);

    useEffect(() => {
        if (isFocused) {
            refreshProfile(); 
        }
    }, [isFocused, refreshProfile]);

    // Los datos ahora usan la variable 'authProfile' directamente
    const profile = authProfile; 
    
    // Datos simulados (deben ser reemplazados por hooks reales para cumplir ISO 25010)
    const statsData = { citas: 4, tratamiento: 2 };
    const recentPatients = [
        { id: 1, name: 'Luna', owner: 'María García', type: 'Gato', status: 'Tratamiento' },
        { id: 2, name: 'Charlie', owner: 'Juan Pérez', type: 'Perro', status: 'Postoperatorio' },
        { id: 3, name: 'Max', owner: 'Ana López', type: 'Perro', status: 'Control rutinario' },
    ];
    
    if (authLoading || loading) {
        return (
            <View style={profileStyles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }
    
    // Mapeo de datos usando la referencia directa 'profile' (que es 'authProfile')
    const vetName = profile?.name || 'González';
    const vetTitle = profile?.title || 'Médico General Veterinario';
    const clinicName = 'Clínica Veterinaria CuidaColitas'; 
    
    const email = profile?.email || 'carlos.gonzalez@cuidacolitas.com';
    const phone = profile?.phone_number || '+34 911 123 456';
    const colegiado = profile?.college_id || 'COV-28-5678';
    const address = profile?.address || 'Calle Veterinarios 123, Madrid';
    const avatarUrl = profile?.avatar_url;


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }}>
            <ScrollView 
                style={profileStyles.container}
                contentContainerStyle={profileStyles.scrollContent}
            >
                {/* --- HEADER SUPERIOR --- */}
                <View style={profileStyles.topHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={profileStyles.screenTitle}>Mi Perfil</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* --- CABECERA DEL PERFIL (Dr. González) --- */}
                <View style={profileStyles.profileHeader}>
                    <View style={profileStyles.avatarCircle}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={profileStyles.avatarImage} />
                        ) : (
                            <Ionicons name="bandage" size={40} color={COLORS.white} />
                        )}
                    </View>
                    <Text style={profileStyles.nameTitle}>Dr. {vetName}</Text>
                    <Text style={profileStyles.specialty}>{vetTitle}</Text>
                    <Text style={profileStyles.clinic}>{clinicName}</Text>
                </View>

                {/* --- 1. Información Profesional --- */}
                <View style={[profileStyles.card, { backgroundColor: COLORS.secondary }]}>
                    <Text style={profileStyles.cardTitle}>Información Profesional</Text>
                    <InfoRow icon="mail-outline" value={email} />
                    <InfoRow icon="call-outline" value={phone} />
                    <InfoRow icon="document-text-outline" value={colegiado} />
                    <InfoRow icon="location-outline" value={address} />
                </View>

                {/* --- 2. Estadísticas de Hoy --- */}
                <View style={profileStyles.sectionContainer}>
                    <Text style={profileStyles.cardTitle}>Estadísticas de Hoy</Text>
                    <View style={profileStyles.statsRow}>
                        <View style={[profileStyles.statCard, { backgroundColor: COLORS.white }]}>
                            <Text style={[profileStyles.statValue, { color: COLORS.primary }]}>{statsData.citas}</Text>
                            <Text style={profileStyles.statLabel}>Citas</Text>
                        </View>
                        <View style={[profileStyles.statCard, { backgroundColor: COLORS.secondary }]}>
                            <Text style={[profileStyles.statValue, { color: COLORS.primary }]}>{statsData.tratamiento}</Text>
                            <Text style={profileStyles.statLabel}>En Tratamiento</Text>
                        </View>
                    </View>
                </View>

                {/* --- 3. Pacientes Recientes --- */}
                <View style={[profileStyles.card, { backgroundColor: COLORS.secondary }]}>
                    <Text style={profileStyles.cardTitle}>Pacientes Recientes</Text>
                    {recentPatients.map(p => (
                        <PatientCard 
                            key={p.id} 
                            patientName={p.name} 
                            ownerName={`Dueño: ${p.owner}`}
                            petType={p.type} 
                            status={p.status} 
                        />
                    ))}
                </View>

                {/* --- 4. Acciones --- */}
                <TouchableOpacity 
                    style={profileStyles.actionButton} 
                    onPress={() => navigation.navigate('EditProfile', { profile: profile })}
                >
                    <Ionicons name="create-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={profileStyles.actionButtonText}>Editar Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[profileStyles.actionButton, profileStyles.logoutButton]} 
                    onPress={signOut}
                >
                    <Ionicons name="log-out-outline" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
                    <Text style={[profileStyles.actionButtonText, profileStyles.logoutButtonText]}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- ESTILOS ---

const profileStyles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.primary, // Fondo principal azul oscuro
    },
    loaderContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.primary,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionContainer: {
        marginHorizontal: 20, 
        marginBottom: 20
    },
    
    // --- Header Top ---
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    screenTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h2,
        color: COLORS.textPrimary,
    },

    // --- Profile Header ---
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
        backgroundColor: COLORS.primary,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.accent, // Círculo verde agua
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 3,
        borderColor: COLORS.secondary, 
        overflow: 'hidden', // Para que la imagen no se salga del círculo
    },
    avatarImage: { // Estilo agregado para mostrar la foto de perfil
        width: '100%',
        height: '100%',
    },
    nameTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h2,
        color: COLORS.textPrimary,
        marginTop: 5,
    },
    specialty: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.secondary,
    },
    clinic: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.secondary,
        opacity: 0.8,
    },
    
    // --- Cards Generales ---
    card: {
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    cardTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
        marginBottom: 15,
    },
    
    // --- Información Profesional ---
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: `${COLORS.card}40`, 
        paddingBottom: 12,
    },
    infoValue: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.primary, 
        flex: 1,
    },
    infoIcon: {
        marginRight: 15,
        width: 20, 
    },

    // --- Estadísticas ---
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    statValue: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h1,
        marginBottom: 5,
    },
    statLabel: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.card,
    },

    // --- Pacientes Recientes ---
    patientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    patientDetails: {
        flex: 1,
    },
    patientName: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.textPrimary,
    },
    patientOwner: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.secondary,
    },
    statusBadge: {
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    statusBadgeText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.caption,
    },

    // --- Botones de Acción ---
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    actionButtonText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
    },
    logoutButton: {
        backgroundColor: COLORS.red,
        borderColor: COLORS.red,
    },
    logoutButtonText: {
        color: COLORS.white,
    }
});