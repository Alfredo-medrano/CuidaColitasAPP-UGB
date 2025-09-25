import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';

// 1. Importamos los nuevos componentes para cada pestaña
import TabVisitas from './TabVisitas';
import TabVacunas from './TabVacunas';
import TabMedicamentos from './TabMedicamentos';
import TabArchivos from './TabArchivos';

export default function HistorialMedico({ route, navigation }) {
  const { petId, petName, ownerName } = route.params;
  const [activeTab, setActiveTab] = useState('Visitas');

  // 2. Esta función decide qué componente de pestaña mostrar
  const renderContent = () => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#fff" /></Pressable>
        <View>
          <Text style={styles.headerTitle}>Historial Médico</Text>
          <Text style={styles.headerSubtitle}>{petName} - {ownerName}</Text>
        </View>
        <View style={{width: 20}} />
      </View>
      
      {/* --- Pestañas de Navegación --- */}
      <View style={styles.tabContainer}>
        {['Visitas', 'Vacunas', 'Medicamentos', 'Archivos'].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* --- Contenido de la Pestaña Activa --- */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#013847' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: '#d3d3d3', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#013847', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#002a36' },
  tab: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  activeTab: { backgroundColor: '#43C0AF' },
  tabText: { color: '#d3d3d3', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  content: { flex: 1 },
});