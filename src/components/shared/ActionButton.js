import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors } from '../../theme/colors';

const ActionButton = ({ onPress, loading, text, iconName, loadingText }) => {
    return (
        <Pressable style={styles.button} onPress={onPress} disabled={loading}>
            {loading ? (
                <ActivityIndicator color={colors.white} />
            ) : (
                <Icon name={iconName} size={14} color={colors.white} />
            )}
            <Text style={styles.text}>{loading ? loadingText : text}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20
    },
    text: {
        color: colors.white,
        fontWeight: 'bold',
        marginLeft: 8
    },
});

export default ActionButton;
