import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const GenericCard = ({ title, date, details }) => (
    <View style={styles.card}>
        <Ionicons name="medkit-outline" size={24} color={COLORS.accent} style={{marginRight: 15}} />
        <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDate}>{date}</Text>
            <Text style={styles.cardDetails}>{details}</Text>
        </View>
    </View>
);

export default function ClientTabMedicamentos({ petId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchData = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('pet_medications')
                .select('*')
                .eq('pet_id', petId)
                .order('prescription_date', { ascending: false });
            if (error) throw error;
            setRecords(data || []);
        } catch (error) { Alert.alert("Error", "No se pudo cargar el historial de medicamentos."); }
        finally { setLoading(false); }
    }, [petId]);

    useEffect(() => { if (isFocused) fetchData(); }, [isFocused, fetchData]);

    if (loading) return <ActivityIndicator style={{ marginTop: 30 }} size="large" color={COLORS.primary} />;

    return (
        <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <GenericCard 
                    title={item.medication_name}
                    date={`Prescrito: ${new Date(item.prescription_date).toLocaleDateString('es-ES')}`}
                    details={`Dosis: ${item.dosage} por ${item.duration}`}
                />
            )}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay medicamentos registrados.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: { padding: 20 },
    card: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.primary, fontSize: 16 },
    cardDate: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: 12, marginVertical: 2 },
    cardDetails: { fontFamily: FONTS.PoppinsRegular, color: COLORS.primary, fontSize: 14 },
    emptyText: { textAlign: 'center', fontFamily: FONTS.PoppinsRegular, color: COLORS.primary, marginTop: 50 },
});