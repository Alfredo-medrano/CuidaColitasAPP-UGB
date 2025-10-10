import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/theme';

export default function CustomTabBar({ state, descriptors, navigation, tabConfig }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const config = tabConfig[route.name] || { icon: 'help-circle-outline', text: route.name };

            const onPress = () => {
                const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                }
            };

            const color = isFocused ? COLORS.accent : 'rgba(255, 255, 255, 0.7)';

            return (
            <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabButton}
            >
                <Ionicons name={config.icon} size={24} color={color} />
                <Text style={[styles.tabLabel, { color }]}>
                {config.text}
                </Text>
            </TouchableOpacity>
            );
        })}
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: COLORS.primary,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.2)',
    },
    tabBarContainer: {
        flexDirection: 'row',
        height: 65,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        paddingBottom: 5,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
    },
    tabLabel: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 12,
        marginTop: 4,
    },
});