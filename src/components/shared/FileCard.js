import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../theme/colors';

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileCard = ({ file, onView, onDelete }) => {
    return (
        <View style={styles.card}>
            <Icon
                name={file.file_type?.includes('pdf') ? 'file-pdf' : 'file-image'}
                size={24}
                color={colors.primary}
            />
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.file_name}</Text>
                <Text style={styles.fileMeta}>
                    {new Date(file.uploaded_at).toLocaleDateString('es-ES')} • {formatBytes(file.file_size_bytes || 0)}
                </Text>
            </View>
            <View style={styles.fileActions}>
                <Pressable style={styles.fileButton} onPress={() => onView(file.storage_path)}>
                    <Icon name="eye" size={18} color={colors.secondary} />
                </Pressable>
                <Pressable style={styles.fileButton} onPress={() => onDelete(file)}>
                    <Icon name="trash-alt" size={18} color={colors.danger} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15
    },
    fileInfo: { flex: 1, marginHorizontal: 15 },
    fileName: { fontSize: 16, fontWeight: '500', color: colors.text },
    fileMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    fileActions: { flexDirection: 'row' },
    fileButton: { marginLeft: 15, padding: 5 },
});

export default FileCard;
