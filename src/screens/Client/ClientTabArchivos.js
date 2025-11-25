import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';

const BUCKET_ID = 'attachments';

const FileCard = ({ file, onDownload, downloading }) => {
    const isImage = file.file_type?.startsWith('image/');
    const getFileIcon = () => {
        if (isImage) return 'image-outline';
        if (file.file_type?.includes('pdf')) return 'document-text-outline';
        return 'document-attach-outline';
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onDownload(file)}
            disabled={downloading}
        >
            <Ionicons
                name={getFileIcon()}
                size={32}
                color={COLORS.accent}
                style={{ marginRight: 15 }}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{file.file_name}</Text>
                <Text style={styles.cardDate}>
                    Subido: {new Date(file.uploaded_at).toLocaleDateString('es-ES')}
                </Text>
                {file.file_size_bytes && (
                    <Text style={styles.cardSize}>
                        {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </Text>
                )}
            </View>
            {downloading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
                <Ionicons name="download-outline" size={24} color={COLORS.primary} />
            )}
        </TouchableOpacity>
    );
};

export default function ClientTabArchivos({ petId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
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
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el historial de archivos.");
        } finally {
            setLoading(false);
        }
    }, [petId]);

    useEffect(() => {
        if (isFocused) fetchData();
    }, [isFocused, fetchData]);

    const handleDownloadFile = async (file) => {
        try {
            setDownloadingId(file.id);

            console.log('[Download] Archivo:', file.file_name);
            console.log('[Download] Storage path:', file.storage_path);

            // 1. Generar signed URL (15 minutos)
            const { data, error } = await supabase.storage
                .from(BUCKET_ID)
                .createSignedUrl(file.storage_path, 60 * 15);

            if (error) {
                console.error('[Download] Error signed URL:', error);
                throw new Error(`No se pudo generar enlace: ${error.message}`);
            }

            if (!data || !data.signedUrl) {
                throw new Error('No se recibió URL firmada del servidor');
            }

            console.log('[Download] Signed URL OK, descargando...');

            // 2. Sanitizar nombre de archivo
            const sanitizedFileName = file.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileUri = FileSystem.documentDirectory + sanitizedFileName;

            // 3. Verificar si el archivo ya existe y eliminarlo
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(fileUri);
            }

            // 4. Descargar archivo
            const downloadResult = await FileSystem.downloadAsync(
                data.signedUrl,
                fileUri
            );

            console.log('[Download] Status:', downloadResult.status);

            // 5. Compartir/Abrir archivo
            if (downloadResult.status === 200) {
                if (Platform.OS === 'android') {
                    // En Android, usar sharing para abrir el archivo
                    await shareAsync(downloadResult.uri, {
                        mimeType: file.file_type,
                        dialogTitle: 'Abrir archivo con...',
                        UTI: file.file_type
                    });
                } else {
                    // En iOS, mostrar mensaje con ubicación
                    Alert.alert(
                        'Descarga completada',
                        `Archivo guardado en documentos de la app`,
                        [
                            {
                                text: 'Abrir',
                                onPress: async () => {
                                    await shareAsync(downloadResult.uri);
                                }
                            },
                            { text: 'OK' }
                        ]
                    );
                }
            } else {
                throw new Error(`Error al descargar: HTTP ${downloadResult.status}`);
            }

        } catch (error) {
            console.error('[handleDownloadFile]', error);
            Alert.alert(
                'Error al descargar',
                error.message || 'No se pudo descargar el archivo. Verifica tu conexión e intenta nuevamente.'
            );
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Cargando archivos...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={records}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <FileCard
                    file={item}
                    onDownload={handleDownloadFile}
                    downloading={downloadingId === item.id}
                />
            )}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color={COLORS.secondary} />
                    <Text style={styles.emptyText}>No hay archivos adjuntos.</Text>
                    <Text style={styles.emptySubtext}>
                        Los archivos que suba tu veterinario aparecerán aquí.
                    </Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 20,
        flexGrow: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.primary,
        marginTop: 10,
    },
    card: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
        fontSize: 16,
        marginBottom: 4,
    },
    cardDate: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.card,
        fontSize: 12,
        marginVertical: 2,
    },
    cardSize: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.card,
        fontSize: 11,
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        textAlign: 'center',
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
        fontSize: 16,
        marginTop: 16,
    },
    emptySubtext: {
        textAlign: 'center',
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        fontSize: 14,
        marginTop: 8,
        paddingHorizontal: 40,
    },
});