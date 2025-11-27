import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../../theme/theme';

const LoadingState = ({ type = 'card', count = 3 }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const renderCardSkeleton = () => (
        <Animated.View style={[styles.cardSkeleton, { opacity }]}>
            <View style={styles.avatarSkeleton} />
            <View style={styles.textContainer}>
                <View style={styles.titleSkeleton} />
                <View style={styles.subtitleSkeleton} />
                <View style={styles.subtitleSkeletonSmall} />
            </View>
        </Animated.View>
    );

    const renderStatSkeleton = () => (
        <Animated.View style={[styles.statSkeleton, { opacity }]}>
            <View style={styles.iconSkeleton} />
            <View style={styles.statTextContainer}>
                <View style={styles.statTitleSkeleton} />
                <View style={styles.statValueSkeleton} />
            </View>
        </Animated.View>
    );

    const renderListSkeleton = () => (
        <Animated.View style={[styles.listItemSkeleton, { opacity }]}>
            <View style={styles.lineSkeleton} />
            <View style={styles.lineSkeletonShort} />
        </Animated.View>
    );

    const skeleton = {
        card: renderCardSkeleton,
        stat: renderStatSkeleton,
        list: renderListSkeleton,
    }[type] || renderCardSkeleton;

    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <View key={index}>{skeleton()}</View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },

    // Card Skeleton
    cardSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    avatarSkeleton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    titleSkeleton: {
        height: 16,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
        width: '60%',
    },
    subtitleSkeleton: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 6,
        width: '80%',
    },
    subtitleSkeletonSmall: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        width: '50%',
    },

    // Stat Skeleton
    statSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    iconSkeleton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#E0E0E0',
        marginRight: 10,
    },
    statTextContainer: {
        flex: 1,
    },
    statTitleSkeleton: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
        width: '40%',
    },
    statValueSkeleton: {
        height: 24,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        width: '30%',
    },

    // List Skeleton
    listItemSkeleton: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    lineSkeleton: {
        height: 14,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 6,
        width: '100%',
    },
    lineSkeletonShort: {
        height: 14,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        width: '70%',
    },
});

export default LoadingState;
