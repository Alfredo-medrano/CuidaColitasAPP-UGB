import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/theme';

const BotpressScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const webViewRef = useRef(null);

  // Verificar autenticación
  useEffect(() => {
    if (!user || !profile) {
      Alert.alert(
        'Autenticación Requerida',
        'Debes iniciar sesión para usar el asistente virtual',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, profile, navigation]);

  // Datos del usuario para el bot
  const userData = {
    id: user?.id || '',
    name: profile?.full_name || 'Usuario',
    email: user?.email || '',
    role: profile?.roles?.name || 'cliente',
  };

  // Configuración del bot de Botpress
  const botConfig = {
    botId: '486828ed-9358-4f39-9286-b698be336d11',
    clientId: 'f12721cb-45be-454d-9b9f-b2c6abbe0228',
    configUrl: 'https://files.bpcontent.cloud/2025/11/26/22/20251126225022-S8Z081KK.json',
  };

  // URL directa proporcionada por el usuario (más confiable)
  const botUrl = `https://cdn.botpress.cloud/webchat/v3.3/shareable.html?configUrl=${botConfig.configUrl}`;

  if (!user || !profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: botUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default BotpressScreen;
