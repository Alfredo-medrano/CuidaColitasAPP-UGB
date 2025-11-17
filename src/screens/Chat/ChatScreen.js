// src/screens/Chat/ChatScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../api/Supabase'; //
import { useAuth } from '../../context/AuthContext'; //
import { COLORS, FONTS, SIZES } from '../../theme/theme'; //
import { Ionicons } from '@expo/vector-icons';

// Componente para una burbuja de mensaje individual
const MessageBubble = ({ message, isCurrentUser }) => {
    return (
        <View
            style={[
                styles.messageContainer,
                isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer,
            ]}
        >
            <View
                style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                ]}
            >
                <Text style={isCurrentUser ? styles.currentUserText : styles.otherUserText}>
                    {message.content}
                </Text>
            </View>
            <Text style={styles.timeText}>
                {new Date(message.created_at).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );
};

export default function ChatScreen() {
    const route = useRoute();
    const { session } = useAuth();
    const { conversation_id } = route.params;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    const userId = session?.user?.id;

    // 1. Cargar los mensajes iniciales
    const fetchMessages = async () => {
        if (!conversation_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error.message);
        } else {
            setMessages(data);
        }
        setLoading(false);
    };

    // 2. Enviar un nuevo mensaje
    const handleSend = async () => {
        if (newMessage.trim() === '' || !userId || !conversation_id) {
            return;
        }

        const messageToSend = {
            conversation_id: conversation_id,
            sender_id: userId,
            content: newMessage.trim(),
        };

        // Limpiamos el input inmediatamente para una UI rápida
        setNewMessage('');

        // Insertamos el mensaje en Supabase
        const { error } = await supabase.from('messages').insert(messageToSend);
        if (error) {
            console.error('Error sending message:', error.message);
            // Si falla, podríamos re-setear el input
            setNewMessage(messageToSend.content);
        }
        // No necesitamos añadir el mensaje al estado aquí, 
        // ¡la suscripción de Realtime lo hará por nosotros!
    };

    // Efecto para cargar mensajes al abrir la pantalla
    useEffect(() => {
        fetchMessages();
    }, [conversation_id]);

    // 3. Suscripción a Realtime para nuevos mensajes
    useEffect(() => {
        if (!conversation_id) return;

        // Escuchamos por INSERTS en la tabla 'messages'
        const channel = supabase
            .channel(`public:messages:conversation_id=eq.${conversation_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation_id}`,
                },
                (payload) => {
                    // Cuando llega un nuevo mensaje, lo añadimos al estado
                    setMessages((prevMessages) => [...prevMessages, payload.new]);
                }
            )
            .subscribe();

        // Limpiamos la suscripción al salir
        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation_id]);

    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" color={COLORS.primary} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageBubble message={item} isCurrentUser={item.sender_id === userId} />
                    )}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={COLORS.textSecondary}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// === ESTILOS ===
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
    },
    messageContainer: {
        marginVertical: 4,
    },
    currentUserMessageContainer: {
        alignItems: 'flex-end',
    },
    otherUserMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: SIZES.radius,
        borderRadius: SIZES.radius,
    },
    currentUserBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: SIZES.base,
    },
    otherUserBubble: {
        backgroundColor: COLORS.lightGray, // Color para el otro usuario
        borderBottomLeftRadius: SIZES.base,
    },
    currentUserText: {
        color: COLORS.white,
        fontFamily: FONTS.PoppinsRegular,
    },
    otherUserText: {
        color: COLORS.textPrimary,
        fontFamily: FONTS.PoppinsRegular,
    },
    timeText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
        marginHorizontal: 4
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.radius,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        backgroundColor: COLORS.white,
    },
    textInput: {
        flex: 1,
        height: 40,
        backgroundColor: COLORS.lightGray,
        borderRadius: 20,
        paddingHorizontal: SIZES.padding,
        fontFamily: FONTS.PoppinsRegular,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SIZES.radius,
    },
});