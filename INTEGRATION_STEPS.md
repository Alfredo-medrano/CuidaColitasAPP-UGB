# Pasos para Integrar el Botón Flotante del Chatbot

## ✅ Listo

1. ✅ Dependencia instalada: `react-native-webview`
2. ✅ `BotpressScreen.js` creado
3. ✅ `FloatingChatButton.js` creado

## 📝 Pasos a Seguir (Copiar y Pegar)

### 1. Agregar Ruta en App.js

**Ubicación**: `App.js` línea ~57 (después de la importación de ChatScreen)

```javascript
import BotpressScreen from './src/screens/ChatBot/BotpressScreen';
```

**Ubicación**: `App.js` línea ~115 (antes de `</Stack.Navigator>`)

```javascript
<Stack.Screen name="ChatBot" component={BotpressScreen} options={{ title: 'Asistente Virtual', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
```

---

### 2. Agregar Botón en ClienteHome.js

**Ubicación**: `src/screens/Client/ClienteHome.js` línea ~10 (con los otros imports)

```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';
```

**Ubicación**: `src/screens/Client/ClienteHome.js` línea ~88 (antes de `</SafeAreaView>`)

```javascript
<FloatingChatButton />
```

---

### 3. Agregar Botón en VeterinarioHome.js

**Ubicación**: `src/screens/Vet/VeterinarioHome.js línea ~9 (con los otros imports)

```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';
```

**Ubicación**: `src/screens/Vet/VeterinarioHome.js` línea ~89 (antes de `</SafeAreaView>`)

```javascript
<FloatingChatButton />
```

---

### 4. Agregar Botón en AdminHome.js

**Ubicación**: `src/screens/admin/AdminHome.js` (al principio, con los otros imports)

```javascript
import FloatingChatButton from '../../components/shared/FloatingChatButton';
```

**Ubicación**: `src/screens/admin/AdminHome.js` (al final, antes del último `</SafeAreaView>` o `</View>`)

```javascript
<FloatingChatButton />
```

---

## 🎉 Resultado

Después de hacer estos cambios:
- Todos los usuarios verán un botón flotante verde en la esquina inferior derecha
- Al presionarlo, se abrirá el chatbot "Dr. CuidaColitas"
- El bot conocerá el nombre, email y rol del usuario

## 🔄 Reiniciar la App

Después de hacer los cambios, recarga la app con:
```bash
npx expo start -c
```

¡Listo! El chatbot estará completamente funcional 🐾
