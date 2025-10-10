import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Linking } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const FileCard = ({ file }) => {
    const handleViewFile = async (filePath) => {
        const { data, error } = await supabase.storage.from('attachments').createSignedUrl(filePath, 60); // URL válida por 60s
        if (error) {
            Alert.alert("Error", "No se pudo obtener el enlace para ver el archivo.");
        } else {
            Linking.openURL(data.signedUrl);
        }
    };
    
    return(
        <TouchableOpacity style={styles.card} onPress={() => handleViewFile(file.storage_path)}>
            <Ionicons name="document-attach-outline" size={24} color={COLORS.accent} style={{marginRight: 15}} />
            <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>{file.file_name}</Text>
                <Text style={styles.cardDate}>Subido: {new Date(file.uploaded_at).toLocaleDateString('es-ES')}</Text>
            </View>
            <Ionicons name="cloud-download-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
    );
};

export default function ClientTabArchivos({ petId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchData = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('medical_attachments')
                .select('*')
                .eq('pet_id', petId)
                .order('uploaded_at', { ascending: false });
            if (error) throw error;
            setRecords(data || []);
        } catch (error) { Alert.alert("Error", "No se pudo cargar el historial de archivos."); }
        finally { setLoading(false); }
    }, [petId]);

    useEffect(() => { if (isFocused) fetchData(); }, [isFocused, fetchData]);

    if (loading) return <ActivityIndicator style={{ marginTop: 30 }} size="large" color={COLORS.primary} />;

    return (
        <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FileCard file={item} />}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay archivos adjuntos.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: { padding: 20 },
    card: { backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
    cardTitle: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.primary, fontSize: 16 },
    cardDate: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: 12, marginVertical: 2 },
    emptyText: { textAlign: 'center', fontFamily: FONTS.PoppinsRegular, color: COLORS.primary, marginTop: 50 },
});