import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const VisitCard = ({ visit }) => {
    const visitDate = new Date(visit.appointment_time);
    // medical_records es un OBJETO (no array) porque hay UNIQUE constraint en appointment_id
    const record = visit.medical_records;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{visitDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <View style={styles.doctorBadge}>
                    <Text style={styles.doctorText}>Dr. {visit.vet.name.split(' ')[0]}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <InfoRow icon="clipboard-outline" label="Diagnóstico" value={record?.diagnosis} />
                <InfoRow icon="pulse-outline" label="Tratamiento" value={record?.treatment} />
                <InfoRow icon="document-text-outline" label="Notas" value={record?.notes} />
            </View>
        </View>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={16} color={COLORS.primary} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
    </View>
);

export default function ClientTabVisitas({ petId }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchVisits = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_time,
                    vet:profiles!vet_id ( name ),
                    medical_records ( diagnosis, treatment, notes )
                `)
                .eq('pet_id', petId)
                .order('appointment_time', { ascending: false });

            if (error) throw error;

            // Filtrar solo las que tienen medical_records (es un objeto, no array)
            const visitsWithRecords = data?.filter(v => v.medical_records && typeof v.medical_records === 'object') || [];
            setVisits(visitsWithRecords);
        } catch (error) {
            console.error('Error fetching visits:', error);
            Alert.alert("Error", "No se pudo cargar el historial de visitas.");
        } finally {
            setLoading(false);
        }
    }, [petId]);

    useEffect(() => {
        if (isFocused) {
            fetchVisits();
        }
    }, [isFocused, fetchVisits]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 30 }} size="large" color={COLORS.primary} />;
    }

    return (
        <FlatList
            data={visits}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <VisitCard visit={item} />}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay visitas registradas.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.secondary,
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: `${COLORS.accent}50`,
        paddingBottom: 10,
        marginBottom: 10,
    },
    dateText: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.card,
        fontSize: 14,
    },
    doctorBadge: {
        backgroundColor: '#7185D8',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    doctorText: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.white,
        fontSize: 12,
    },
    cardBody: {
        paddingTop: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    infoIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    infoLabel: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
        fontSize: 15,
    },
    infoValue: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.card,
        fontSize: 15,
        marginLeft: 5,
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.primary,
        marginTop: 50,
    },
});