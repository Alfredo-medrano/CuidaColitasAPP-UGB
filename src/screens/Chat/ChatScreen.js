import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Alert,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';

import { supabase } from '../../api/Supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { sendPushNotification } from '../../services/notificationService';

export default function ChatScreen({ route, navigation }) {
    const { conversation_id, other_user_id, other_user_name } = route.params || {};
    const { user, profile } = useAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showPetsModal, setShowPetsModal] = useState(false);
    const [otherUserPets, setOtherUserPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(false);

    const flatListRef = useRef();

    useLayoutEffect(() => {
        const isVet = profile?.roles?.name === 'veterinario';

        navigation.setOptions({
            title: other_user_name || 'Chat',
            headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 18 },
            headerRight: () => (
                isVet ? (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.headerPetButton}
                        onPress={() => {
                            if (!other_user_id) {
                                Alert.alert("Ups", "No se pudo identificar al usuario para ver sus mascotas.");
                                return;
                            }
                            setShowPetsModal(true);
                            fetchOtherUserPets();
                        }}
                    >
                        <Ionicons name="paw" size={18} color={COLORS.primary} />
                        <Text style={styles.headerPetButtonText}>Mascotas</Text>
                    </TouchableOpacity>
                ) : null
            ),
        });
    }, [navigation, other_user_name, other_user_id, profile]);

    useEffect(() => {
        if (!conversation_id) return;

        fetchMessages();

        const channel = supabase
            .channel(`chat_room_${conversation_id}`, {
                config: {
                    broadcast: { self: false },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation_id}`,
                },
                (payload) => {
                    handleNewMessageRealtime(payload.new);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation_id}`,
                },
                (payload) => {
                    handleMessageUpdateRealtime(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            markAsRead();
        };
    }, [conversation_id]);

    const handleNewMessageRealtime = async (newMsg) => {
        setMessages((prev) => {
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) return prev;
            return [newMsg, ...prev];
        });

        if (newMsg.sender_id !== user.id) {
            await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
        }
    };

    const handleMessageUpdateRealtime = (updatedMsg) => {
        setMessages((prev) => prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg)));
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation_id)
            .order('created_at', { ascending: false });

        if (!error) {
            setMessages(data);
            markAsRead();
        }
        setLoading(false);
    };

    const markAsRead = async () => {
        if (!conversation_id || !user?.id) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversation_id)
            .neq('sender_id', user.id)
            .is('is_read', false);
    };

    const fetchOtherUserPets = async () => {
        if (!other_user_id) return;
        setLoadingPets(true);
        const { data, error } = await supabase.from('pets').select('*').eq('owner_id', other_user_id);
        if (!error) setOtherUserPets(data || []);
        setLoadingPets(false);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !conversation_id) return;
        const msgText = newMessage.trim();
        setNewMessage('');
        try {
            await supabase.from('messages').insert({
                conversation_id: conversation_id,
                sender_id: user.id,
                content: msgText,
                is_read: false,
            });

            // 🔔 ENVIAR NOTIFICACIÓN PUSH AL DESTINATARIO
            if (other_user_id) {
                const senderName = profile?.name || 'Alguien';
                sendPushNotification(
                    other_user_id,
                    senderName,
                    msgText,
                    conversation_id
                ).catch(err => console.warn('Error enviando push:', err));
            }
        } catch (error) {
            console.error('Error enviando:', error.message);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'Edad desconocida';
        const years = moment().diff(moment(birthDate), 'years');
        return years === 0 ? 'Menos de 1 año' : `${years} años`;
    };

    const renderMessageItem = ({ item, index }) => {
        const isMyMessage = item.sender_id === user.id;

        const isOlderMessageSame = messages[index + 1]?.sender_id === item.sender_id;
        const isNewerMessageSame = messages[index - 1]?.sender_id === item.sender_id;

        const bubbleStyle = {
            ...styles.messageBubble,
            ...(isMyMessage ? styles.myBubble : styles.otherBubble),
        };

        if (isMyMessage) {
            if (isOlderMessageSame) bubbleStyle.borderTopRightRadius = 4;
            if (isNewerMessageSame) bubbleStyle.borderBottomRightRadius = 4;
        } else {
            if (isOlderMessageSame) bubbleStyle.borderTopLeftRadius = 4;
            if (isNewerMessageSame) bubbleStyle.borderBottomLeftRadius = 4;
        }

        return (
            <View style={bubbleStyle}>
                <Text style={[styles.msgText, isMyMessage ? styles.myMsgText : styles.otherMsgText]}>
                    {item.content}
                </Text>

                <View style={styles.metaData}>
                    <Text style={[styles.timeText, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: COLORS.gray }]}>
                        {moment(item.created_at).format('h:mm a')}
                    </Text>
                    {isMyMessage && (
                        <View style={{ marginLeft: 4 }}>
                            <Ionicons
                                name={item.is_read ? "checkmark-done" : "checkmark"}
                                size={16}
                                color={item.is_read ? COLORS.secondary : 'rgba(255,255,255,0.6)'}
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
                {loading ? (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMessageItem}
                        inverted
                        contentContainerStyle={messages.length === 0 ? { flex: 1, justifyContent: 'center' } : styles.listContent}
                        ListEmptyComponent={() => (
                            <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
                                <View style={styles.emptyIconBg}>
                                    <Ionicons name="chatbubbles-outline" size={32} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyText}>No hay mensajes aún</Text>
                                <Text style={styles.emptySubText}>¡Envía el primero!</Text>
                            </View>
                        )}
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#999"
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!newMessage.trim()}
                    >
                        <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={showPetsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPetsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mascotas de {other_user_name}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowPetsModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        {loadingPets ? (
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        ) : (
                            <FlatList
                                data={otherUserPets}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.petCard}>
                                        <View style={styles.petIconBox}>
                                            <Ionicons name="paw" size={24} color={COLORS.primary} />
                                        </View>
                                        <View>
                                            <Text style={styles.petName}>{item.name}</Text>
                                            <Text style={styles.petDetail}>{item.species} • {item.breed}</Text>
                                            <Text style={styles.petDetail}>{calculateAge(item.birth_date)}</Text>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyPetsContainer}>
                                        <Text style={styles.emptyPetsText}>Este usuario no tiene mascotas registradas.</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F8',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    messageBubble: {
        maxWidth: '82%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        marginBottom: 4,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.card,
        borderBottomRightRadius: 2,
    },
    otherBubble: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    msgText: {
        fontSize: 15,
        fontFamily: FONTS.PoppinsRegular,
        lineHeight: 22,
    },
    myMsgText: { color: COLORS.white },
    otherMsgText: { color: '#333' },
    metaData: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 2,
    },
    timeText: {
        fontSize: 10,
        fontFamily: FONTS.PoppinsRegular,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        opacity: 0.8,
    },
    emptyIconBg: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    emptyText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: 18,
        color: COLORS.primary,
    },
    emptySubText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 5,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 12,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 15,
        marginRight: 10,
        maxHeight: 100,
        color: COLORS.black,
    },
    sendBtn: {
        backgroundColor: COLORS.accent,
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 1,
        elevation: 2,
    },
    sendBtnDisabled: {
        backgroundColor: '#CCC',
        elevation: 0,
    },
    headerPetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 5,
    },
    headerPetButtonText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: 12,
        color: COLORS.primary,
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        maxHeight: '70%',
        minHeight: '30%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.primary,
    },
    closeButton: {
        padding: 5,
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
    },
    petCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    petIconBox: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.secondary + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    petName: {
        fontSize: 16,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
    },
    petDetail: {
        fontSize: 12,
        fontFamily: FONTS.PoppinsRegular,
        color: '#666',
    },
    emptyPetsContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyPetsText: {
        marginTop: 10,
        fontFamily: FONTS.PoppinsRegular,
        color: '#999',
    },
});