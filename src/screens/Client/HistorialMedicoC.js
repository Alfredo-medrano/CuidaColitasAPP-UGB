import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import ClientTabVisitas from './ClientTabVisitas';
import ClientTabVacunas from './ClientTabVacunas';
import ClientTabMedicamentos from './ClientTabMedicamentos';
import ClientTabArchivos from './ClientTabArchivos';

// Nombres de las pestañas
const TABS = ['Visitas', 'Vacunas', 'Medicamentos', 'Archivos'];

export default function HistorialMedicoC({ route, navigation }) {
    const { petId, petName, petSpecies } = route.params; 
    const [activeTab, setActiveTab] = useState('Visitas');

    // Renderiza el contenido según la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'Visitas': return <ClientTabVisitas petId={petId} />;
            case 'Vacunas': return <ClientTabVacunas petId={petId} />;
            case 'Medicamentos': return <ClientTabMedicamentos petId={petId} />;
            case 'Archivos': return <ClientTabArchivos petId={petId} />;
            default: return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Historial Médico</Text>
                    <Text style={styles.headerSubtitle}>{petName} - {petSpecies}</Text>
                </View>
                <View style={styles.headerButton} />
            </View>
            
            <View style={styles.tabContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)} 
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.primary 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    headerButton: { width: 30 },
    headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary, textAlign: 'center' },
    headerSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.secondary, textAlign: 'center' },
    tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: COLORS.card },
    tab: { paddingVertical: 15, alignItems: 'center', flex: 1 },
    activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.accent },
    tabText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.secondary, fontSize: 15 },
    activeTabText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.textPrimary },
    content: { flex: 1, backgroundColor: COLORS.secondary },
});