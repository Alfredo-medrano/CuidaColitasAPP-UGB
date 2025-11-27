import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../theme/theme';

const SearchBar = ({
    value,
    onChangeText,
    placeholder = 'Buscar...',
    onClear
}) => {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else {
            onChangeText('');
        }
    };

    return (
        <View style={styles.container}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={COLORS.gray}
                returnKeyType="search"
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 50,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body3,
        color: COLORS.black,
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
    },
});

export default SearchBar;
