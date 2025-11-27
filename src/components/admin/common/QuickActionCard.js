import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../../theme/theme';
import { responsiveSize } from '../../../utils/helpers';

/**
 * QuickActionCard
 * Card component for admin quick actions
 */
export default function QuickActionCard({ icon, label, color = COLORS.accent, onPress }) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <MaterialCommunityIcons name={icon} size={responsiveSize(32)} color={COLORS.white} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(16),
        padding: responsiveSize(16),
        alignItems: 'center',
        justifyContent: 'center',
        width: '48%',
        aspectRatio: 1,
        marginBottom: responsiveSize(12),
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: responsiveSize(64),
        height: responsiveSize(64),
        borderRadius: responsiveSize(32),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: responsiveSize(12),
    },
    label: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.black,
        textAlign: 'center',
    },
});
