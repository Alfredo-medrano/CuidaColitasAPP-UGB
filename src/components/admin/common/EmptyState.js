import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES } from '../../../theme/theme';

const EmptyState = ({
    icon = 'inbox-outline',
    title = 'No hay datos',
    message = 'No se encontraron resultados',
    action = null, // { label: 'Texto', onPress: () => {} }
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={80} color={COLORS.gray} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {action && (
                <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
                    <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
        color: COLORS.white,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body3,
        color: COLORS.textPrimary,
        textAlign: 'center',
        opacity: 0.8,
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    actionText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body3,
        color: COLORS.primary,
    },
});

export default EmptyState;
