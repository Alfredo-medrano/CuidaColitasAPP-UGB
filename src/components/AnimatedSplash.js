import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { COLORS, FONTS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

/**
 * AnimatedSplash - Splash screen con animación usando Animated API nativo
 * (Sin react-native-reanimated para evitar errores de worklets)
 * 
 * @param {Function} onAnimationEnd - Callback cuando termina la animación
 */
export default function AnimatedSplash({ onAnimationEnd }) {
    // Valores animados (usando Animated de React Native)
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(30)).current;
    const containerOpacity = useRef(new Animated.Value(1)).current;
    const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Secuencia de animaciones
        Animated.sequence([
            // 1. Logo entra con escala y fade
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),

            // 2. Texto aparece
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(textTranslateY, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),

            // 3. Pulso del logo
            Animated.sequence([
                Animated.timing(logoScale, {
                    toValue: 1.1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Animación de los puntos de carga
        const animateDots = () => {
            Animated.sequence([
                Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(dotOpacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            ]).start();

            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dotOpacity2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                ]).start();
            }, 200);

            setTimeout(() => {
                Animated.sequence([
                    Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dotOpacity3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                ]).start();
            }, 400);
        };

        animateDots();
        const dotsInterval = setInterval(animateDots, 1000);

        // Fade out después de 2.5 segundos
        const timeout = setTimeout(() => {
            Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {
                if (onAnimationEnd) {
                    onAnimationEnd();
                }
            });
        }, 2500);

        return () => {
            clearTimeout(timeout);
            clearInterval(dotsInterval);
        };
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
            {/* Logo animado */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }]
                    }
                ]}
            >
                <Image
                    source={require('../assets/Perrito_blanco.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Nombre de la app */}
            <Animated.View
                style={[
                    styles.textContainer,
                    {
                        opacity: textOpacity,
                        transform: [{ translateY: textTranslateY }]
                    }
                ]}
            >
                <Text style={styles.appName}>CuidaColitas</Text>
                <Text style={styles.tagline}>Tu mascota, nuestra prioridad</Text>
            </Animated.View>

            {/* Indicador de carga */}
            <View style={styles.loadingContainer}>
                <View style={styles.loadingDots}>
                    <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
                    <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
                    <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.45,
        height: width * 0.45,
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    appName: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: 36,
        color: COLORS.white,
        letterSpacing: 1,
    },
    tagline: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 14,
        color: COLORS.secondary,
        marginTop: 5,
        opacity: 0.9,
    },
    loadingContainer: {
        position: 'absolute',
        bottom: height * 0.12,
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
        marginHorizontal: 4,
    },
});
