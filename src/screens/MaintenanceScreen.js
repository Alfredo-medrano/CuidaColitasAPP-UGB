import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="construct" size={80} color={COLORS.accent} />
                </View>
                <Text style={styles.title}>En Mantenimiento</Text>
                <Text style={styles.message}>
                    Estamos realizando mejoras en el sistema. Por favor, intenta de nuevo más tarde.
                </Text>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>CuidaColitas App</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    iconContainer: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: COLORS.accent + '20',
        borderRadius: 60,
    },
    title: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h2,
        color: COLORS.textPrimary,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent,
        fontSize: SIZES.caption,
    },
});
