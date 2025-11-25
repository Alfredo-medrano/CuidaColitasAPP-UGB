import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { colors } from '../../theme/colors';

const OptimizedList = ({
    data,
    renderItem,
    keyExtractor,
    emptyText = 'No hay datos disponibles.',
    contentContainerStyle,
    ...props
}) => {
    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
            }
            contentContainerStyle={[styles.container, contentContainerStyle]}
            {...props}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.textLight,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default OptimizedList;
