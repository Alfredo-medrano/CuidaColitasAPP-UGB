import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';

import TabVisitas from './../Vet/TabVisitas';
import TabVacunas from './../VetTabVacunas';
import TabMedicamentos from './../Vet/TabMedicamentos';
import TabArchivos from './../Vet/TabArchivos';

export default function HistorialMedico({ route, navigation }) {
  const { petId, petName, ownerName, userRole } = route.params;
  const [activeTab, setActiveTab] = useState('Visitas');

  const renderContent = () => {
    switch (activeTab) {
      case 'Visitas':
        return <TabVisitas petId={petId} userRole={userRole} navigation={navigation} />;
      case 'Vacunas':
        return <TabVacunas petId={petId} userRole={userRole} navigation={navigation} />;
      case 'Medicamentos':
        return <TabMedicamentos petId={petId} userRole={userRole} navigation={navigation} />;
      case 'Archivos':
        return <TabArchivos petId={petId} userRole={userRole} navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#fff" /></Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{petName}</Text>
          <Text style={styles.headerSubtitle}>Dueño: {ownerName}</Text>
        </View>
        <View style={{ width: 20 }} />
      </View>
      
      <View style={styles.tabContainer}>
        {['Visitas', 'Vacunas', 'Medicamentos', 'Archivos'].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#013847' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  titleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: '#d3d3d3', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#013847', paddingHorizontal: 15, paddingBottom: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  activeTab: { backgroundColor: '#43C0AF' },
  tabText: { color: '#fff', fontWeight: 'bold' },
  activeTabText: { color: '#013847' },
  content: { flex: 1, backgroundColor: '#E2ECED', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10 },
});