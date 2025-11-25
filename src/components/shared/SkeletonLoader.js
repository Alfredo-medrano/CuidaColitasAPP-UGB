import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';

const SkeletonItem = ({ width, height, style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, opacity },
                style,
            ]}
        />
    );
};

const SkeletonLoader = ({ count = 3, type = 'list' }) => {
    if (type === 'list') {
        return (
            <View>
                {Array.from({ length: count }).map((_, index) => (
                    <View key={index} style={styles.listItem}>
                        <SkeletonItem width={40} height={40} style={{ borderRadius: 20, marginRight: 15 }} />
                        <View style={{ flex: 1 }}>
                            <SkeletonItem width="70%" height={16} style={{ marginBottom: 8 }} />
                            <SkeletonItem width="40%" height={12} />
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    // Default or other types can be added here
    return <SkeletonItem width="100%" height={100} />;
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
        borderRadius: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        backgroundColor: colors.white,
        borderRadius: 12,
    },
});

export default SkeletonLoader;
