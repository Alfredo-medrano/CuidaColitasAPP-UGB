import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../../theme/theme';

const FloatingChatButton = () => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate('ChatBot')}
            activeOpacity={0.8}
        >
            <Ionicons name="chatbubbles" size={26} color={COLORS.white} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
        zIndex: 999,
    },
});

export default FloatingChatButton;
