import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES } from '../../../theme/theme';

const UserCard = ({
    user,
    onPress,
    variant = 'default', // 'default' | 'vet' | 'client'
    actions = [], // [{ icon: 'edit', label: 'Editar', onPress: () => {} }]
}) => {
    const getIconName = () => {
        switch (variant) {
            case 'vet':
                return 'stethoscope';
            case 'client':
                return 'person-circle-outline';
            default:
                return 'person-circle-outline';
        }
    };

    const getIconComponent = () => {
        if (variant === 'vet') {
            return <MaterialCommunityIcons name={getIconName()} size={32} color={COLORS.primary} />;
        }
        return <Ionicons name={getIconName()} size={32} color={COLORS.secondary} />;
    };

    const isActive = user.is_active !== false;

    return (
        <View style={styles.card}>
            {/* Header con nombre y estado */}
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {getIconComponent()}
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                        {user.name || 'Sin Nombre'}
                    </Text>
                    {variant === 'vet' && user.title && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {user.title}
                        </Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isActive ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.statusText, { color: isActive ? '#4CAF50' : '#F44336' }]}>
                        {isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            {/* Información de contacto */}
            <View style={styles.cardBody}>
                {user.email && (
                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={16} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1}>{user.email}</Text>
                    </View>
                )}
                {user.phone_number && (
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1}>{user.phone_number}</Text>
                    </View>
                )}
                {variant === 'vet' && user.college_id && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#666" />
                        <Text style={styles.infoText} numberOfLines={1}>{user.college_id}</Text>
                    </View>
                )}
                {variant === 'client' && user.address && (
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.infoText} numberOfLines={2}>{user.address}</Text>
                    </View>
                )}
            </View>

            {/* Acciones */}
            {actions.length > 0 && (
                <View style={styles.actionsContainer}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.actionButton,
                                action.icon === 'trash-outline' && styles.deleteButton
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                action.onPress();
                            }}
                        >
                            <Ionicons name={action.icon} size={18} color={action.color || '#FFF'} />
                            <Text style={[
                                styles.actionButtonText,
                                action.icon === 'trash-outline' && styles.deleteButtonText
                            ]}>
                                {action.icon === 'create-outline' ? 'Editar' :
                                    action.icon === 'trash-outline' ? 'Eliminar' :
                                        action.icon === 'pause-circle-outline' ? 'Desactivar' :
                                            action.icon === 'checkmark-circle-outline' ? 'Activar' : 'Acción'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: 16,
        color: '#1A1A1A',
        marginBottom: 2,
    },
    subtitle: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 13,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontFamily: FONTS.PoppinsMedium,
        fontSize: 11,
    },
    cardBody: {
        padding: 16,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 14,
        color: '#444',
        flex: 1,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#4FC3F7',
        gap: 6,
    },
    deleteButton: {
        backgroundColor: '#EF5350',
    },
    actionButtonText: {
        fontFamily: FONTS.PoppinsMedium,
        fontSize: 13,
        color: '#FFF',
    },
    deleteButtonText: {
        color: '#FFF',
    },
});

export default UserCard;
