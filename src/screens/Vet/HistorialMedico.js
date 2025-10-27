import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 
// Importamos los componentes de las pestañas (se asume que TabVisitas.js, etc., existen)
import TabVisitas from './TabVisitas';
import TabVacunas from './TabVacunas';
import TabMedicamentos from './TabMedicamentos';
import TabArchivos from './TabArchivos';


// --------------------------------------------------------
// --- UTILITIES (FIX: Incluidas para el alcance) ---
// --------------------------------------------------------
const calculateAge = (birthDate) => {
    if (!birthDate) return 'Desconocida';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years > 0) return `${years} años`;
    if (months > 0) return `${months} meses`;
    return 'Menos de 1 mes';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};


// --------------------------------------------------------
// --- HOOK: usePatientDetails (Carga de Datos Iniciales) ---
// --------------------------------------------------------
const usePatientDetails = (petId) => {
    const [patientInfo, setPatientInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDetails = useCallback(async () => {
        if (!petId) return;

        try {
            setLoading(true);
            // ⭐️ Consulta Completa (ISO 25012)
            const { data: pet, error: petError } = await supabase
                .from('pets')
                .select(`
                    name, 
                    breed, 
                    birth_date, 
                    sex, 
                    weight_kg, 
                    is_neutered, 
                    color, 
                    species:species_id (name),
                    owner:profiles!owner_id (phone_number, name)
                `)
                .eq('id', petId)
                .single();

            if (petError) throw petError;
            
            // Procesamiento de datos
            const age = pet.birth_date ? calculateAge(pet.birth_date) : 'N/A';
            const sexLabel = pet.sex === 'Macho' ? 'Macho' : pet.sex === 'Hembra' ? 'Hembra' : 'N/A';
            const isNeuteredLabel = pet.is_neutered ? 'Sí' : 'No';

            setPatientInfo({
                name: pet.name,
                species: pet.species?.name || 'Desconocida',
                breed: pet.breed || 'N/A',
                age: age,
                weight: pet.weight_kg ? `${pet.weight_kg} kg` : 'N/A',
                sex: sexLabel,
                isNeutered: isNeuteredLabel,
                ownerPhone: pet.owner?.phone_number || 'N/A',
                ownerName: pet.owner?.name || 'N/A'
            });

        } catch (err) {
            console.error('Error al cargar detalles del paciente:', err.message);
            setError('Error al cargar los datos del historial.');
        } finally {
            setLoading(false);
        }
    }, [petId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { patientInfo, loading, error };
};


// --------------------------------------------------------
// --- Componente Modular: PatientHeaderInfo (DRY) ---
// --------------------------------------------------------
const PatientHeaderInfo = ({ info, loading }) => {
    if (loading) {
        return (
            <View style={headerStyles.infoContainer}>
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
            </View>
        );
    }
    
    if (!info) return null;

    // Estructuramos la información para el layout de 2 columnas
    const petDetails = [
        { label: 'Especie', value: info.species },
        { label: 'Raza', value: info.breed },
        { label: 'Edad', value: info.age },
        { label: 'Peso', value: info.weight },
        { label: 'Sexo', value: info.sex },
        { label: 'Esterilizado', value: info.isNeutered },
        { label: 'Tel. Dueño', value: info.ownerPhone, isContact: true },
    ];

    return (
        <View style={headerStyles.infoContainer}>
            <View style={headerStyles.row}>
                {petDetails.slice(0, 4).map((item, index) => (
                    <View key={index} style={headerStyles.col}>
                        <Text style={headerStyles.label}>{item.label}:</Text>
                        <Text style={headerStyles.value}>{item.value}</Text>
                    </View>
                ))}
            </View>
            <View style={headerStyles.row}>
                 {petDetails.slice(4).map((item, index) => (
                    <View key={index + 4} style={headerStyles.col}>
                        <Text style={headerStyles.label}>{item.label}:</Text>
                        <Text style={[headerStyles.value, item.isContact && headerStyles.contactValue]}>{item.value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};


// --------------------------------------------------------
// --- Componente Principal HistorialMedico ---
// --------------------------------------------------------

export default function HistorialMedico({ route, navigation }) {
    // ⭐️ FIX: Capturamos 'patientId' y lo usamos como petId para la consulta
    const { patientId: petId, petName: initialPetName, ownerName: initialOwnerName } = route.params;
    const [activeTab, setActiveTab] = useState('Visitas');
    
    // Carga de datos
    const { patientInfo, loading, error } = usePatientDetails(petId);

    // Ajustar título/subtítulo si los datos se cargaron
    const petName = patientInfo?.name || initialPetName;
    const ownerName = patientInfo?.ownerName || initialOwnerName;

    // Manejo de error del hook
    useEffect(() => {
        if (error) {
            Alert.alert("Error de Historial", error);
        }
    }, [error]);

    const renderContent = () => {
        // La pestaña Visitas debe recibir los datos del paciente para su cabecera interna si es necesario
        switch (activeTab) {
            case 'Visitas':
                return <TabVisitas petId={petId} petName={petName} navigation={navigation} />;
            case 'Vacunas':
                return <TabVacunas petId={petId} navigation={navigation} />;
            case 'Medicamentos':
                return <TabMedicamentos petId={petId} navigation={navigation} />;
            case 'Archivos':
                return <TabArchivos petId={petId} navigation={navigation} />;
            default:
                return null;
        }
    };
    
    const handleNewVisit = () => {
        // Navegar a la pantalla de nueva visita, pasando datos clave
        navigation.navigate('NuevaVisita', { petId, petName, ownerName, vetName: 'Dr. González' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* --- Header Fijo --- */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <View style={styles.titleGroup}>
                    <Text style={styles.headerTitle}>Historial Médico</Text>
                    <Text style={styles.headerSubtitle}>{petName} - {ownerName}</Text>
                </View>
                <View style={{width: 24}} /> 
            </View>
            
            {/* --- Información Detallada del Paciente (Header Info) --- */}
            <View style={styles.patientInfoSection}>
                <PatientHeaderInfo info={patientInfo} loading={loading} />
            </View>

            {/* --- Pestañas de Navegación --- */}
            <View style={styles.tabContainer}>
                {['Visitas', 'Vacunas', 'Medicamentos', 'Archivos'].map(tab => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </Pressable>
                ))}
            </View>

            {/* --- Botón Flotante (+ Nueva Visita) --- */}
            {activeTab === 'Visitas' && (
                <TouchableOpacity style={styles.newVisitButton} onPress={handleNewVisit} disabled={loading}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.newVisitButtonText}>+ Nueva Visita</Text>
                </TouchableOpacity>
            )}

            {/* --- Contenido de la Pestaña Activa --- */}
            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
}

// --- ESTILOS ---

// Estilos del encabezado detallado (PatientHeaderInfo)
const headerStyles = StyleSheet.create({
    infoContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.card, // Turquesa oscuro para el bloque de info
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginBottom: 5,
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 5,
    },
    col: {
        width: '50%', // Dos columnas
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.caption,
        color: COLORS.secondary, // Turquesa claro
        marginRight: 5,
    },
    value: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.textPrimary, // Blanco
    },
    contactValue: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent, // Verde agua para el teléfono
    }
});


// Estilos del componente principal
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.primary 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
    },
    titleGroup: {
        alignItems: 'center',
    },
    headerTitle: { 
        fontSize: SIZES.h2, 
        fontFamily: FONTS.PoppinsBold, 
        color: COLORS.textPrimary, // Blanco/Claro
        textAlign: 'center' 
    },
    headerSubtitle: { 
        fontSize: SIZES.body, 
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary, // Turquesa Claro
        textAlign: 'center' 
    },
    patientInfoSection: {
        backgroundColor: COLORS.primary, // Fondo principal
        paddingBottom: 5,
    },
    tabContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        backgroundColor: COLORS.primary, 
        paddingHorizontal: 15, 
        paddingBottom: 15, 
    },
    tab: { 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 20,
        backgroundColor: COLORS.primary,
    },
    activeTab: { 
        backgroundColor: COLORS.accent, // Verde agua
    },
    tabText: { 
        color: COLORS.secondary, // Turquesa claro
        fontFamily: FONTS.PoppinsSemiBold,
    },
    activeTabText: { 
        color: COLORS.primary, // Texto oscuro sobre pestaña activa
        fontFamily: FONTS.PoppinsSemiBold,
    },
    content: { 
        flex: 1, 
    },
    // Botón Flotante
    newVisitButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 30,
        zIndex: 10, // Asegura que esté por encima de la lista
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    newVisitButtonText: {
        marginLeft: 8,
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.primary,
    }
});