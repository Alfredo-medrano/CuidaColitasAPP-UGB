# Guía de Integración de Botpress - "Dr. CuidaColitas"

## ✅ Lo que Ya está Hecho

1. **Dependencia instalada**: `react-native-webview`
2. **Componente del bot creado**: `d:\UGB\ing software 2\CuidaColitasAPP-UGB\src\screens\ChatBot\BotpressScreen.js`
3. **Botón flotante creado**: `d:\UGB\ing software 2\CuidaColitasAPP-UGB\src\components\shared\FloatingChatButton.js`

## 🎯 Cómo Usar el Bot

### Opción 1: Agregar Botón Flotante (Recomendado)

Agrega el botón flotante en las pantallas Home de cada rol:

**Para ClienteHome.js:**
```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';

// Al final del return, después del último View:
<FloatingChatButton />
```

**Para VeterinarioHome.js:**
```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';

// Al final del return, después del último View:
<FloatingChatButton />
```

**Para AdminHome.js:**
```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';

// Al final del return, después del último View:
<FloatingChatButton />
```

### Opción 2: Agregar Ruta en App.js

Agregar estas líneas en `App.js`:

**1. Importar el componente (línea ~58):**
```javascript
import BotpressScreen from './src/screens/ChatBot/BotpressScreen';
```

**2. Agregar ruta en AppStack (después de la línea 115, antes de `</Stack.Navigator>`):**
```javascript
<Stack.Screen 
  name="ChatBot" 
  component={BotpressScreen} 
  options={{ 
    title: 'Asistente Virtual', 
    headerStyle: { backgroundColor: COLORS.primary }, 
    headerTintColor: '#fff' 
  }} 
/>
```

Luego podrás navegar al bot con:
```javascript
navigation.navigate('ChatBot')
```

##  Información del Bot

- **Nombre**: Dr. CuidaColitas
- **Bot ID**: `486828ed-9358-4f39-9286-b698be336d11`
- **Client ID**: `f12721cb-45be-454d-9b9f-b2c6abbe0228`
- **Descripción oficial**: "Transforma las interacciones transaccionales y repetitivas en autoservicio o en consultas rápidas, optimizando el tiempo y mejorando la satisfacción"

## 🔐 Seguridad

El bot ya está configurado para:
- ✅ Solo funcionar con usuarios autenticados
- ✅ Recibir datos del usuario (nombre, email, rol)
- ✅ Personalizar experiencia según rol
- ✅ Usar los colores de tu tema

## 📱 Siguiente Paso

Elige una de las dos opciones anteriores y el bot estará completamente funcional.
