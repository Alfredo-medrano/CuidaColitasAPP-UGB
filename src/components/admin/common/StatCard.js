import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES } from '../../../theme/theme';

const StatCard = ({
    icon,
    iconBg = COLORS.card,
    title,
    value,
    iconColor = COLORS.white,
    trend = null, // { value: '+12%', positive: true }
}) => {
    return (
        <View style={styles.card}>
            <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
                <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.valueRow}>
                    <Text style={styles.value}>{value}</Text>
                    {trend && (
                        <View style={[styles.trendBadge, { backgroundColor: trend.positive ? '#E8F5E9' : '#FFEBEE' }]}>
                            <MaterialCommunityIcons
                                name={trend.positive ? 'trending-up' : 'trending-down'}
                                size={14}
                                color={trend.positive ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={[styles.trendText, { color: trend.positive ? '#4CAF50' : '#F44336' }]}>
                                {trend.value}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        marginBottom: 10,
    },
    iconBadge: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        color: '#4E666B',
        fontFamily: FONTS.PoppinsRegular,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    value: {
        fontSize: 28,
        color: COLORS.black,
        fontFamily: FONTS.PoppinsBold,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    trendText: {
        fontSize: 10,
        fontFamily: FONTS.PoppinsSemiBold,
        marginLeft: 2,
    },
});

export default StatCard;
