import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    StatusBar,
    Image
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';

import { supabase } from '../../api/Supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// Componente para el Avatar (Iniciales o Imagen)
const Avatar = ({ name, avatarUrl }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    if (avatarUrl) {
        return (
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initial}</Text>
        </View>
    );
};

// Item de la lista (Tarjeta de Conversación)
const ConversationItem = ({ item, currentUserId }) => {
    const navigation = useNavigation();

    // Identificar al otro usuario
    const otherUser = item.client_id?.id === currentUserId ? item.vet_id : item.client_id;

    if (!otherUser) return null;

    // Lógica de "No Leído": 
    // Si el último mensaje NO fue leído Y NO fui yo quien lo envió.
    const isUnread = !item.last_message_is_read && item.last_message_sender_id !== currentUserId;

    const goToChat = () => {
        navigation.navigate('ChatScreen', {
            conversation_id: item.id,
            other_user_name: otherUser.name,
            other_user_id: otherUser.id,
        });
    };

    // Formatear fecha (ej: "10:30 AM" o "Ayer")
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = moment(dateString);
        if (date.isSame(moment(), 'day')) return date.format('LT'); // 10:30 AM
        if (date.isSame(moment().subtract(1, 'days'), 'day')) return 'Ayer';
        return date.format('DD/MM/YY');
    };

    return (
        <TouchableOpacity
            style={[styles.card, isUnread && styles.cardUnread]}
            onPress={goToChat}
            activeOpacity={0.7}
        >
            <Avatar name={otherUser.name} avatarUrl={otherUser.avatar_url} />

            <View style={styles.contentContainer}>
                <View style={styles.topRow}>
                    <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
                        {otherUser.name}
                    </Text>
                    <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>
                        {formatTime(item.last_message_at)}
                    </Text>
                </View>

                <View style={styles.bottomRow}>
                    <Text
                        style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                        numberOfLines={1}
                    >
                        {item.last_message_content || '👋 Inicia la conversación...'}
                    </Text>

                    {isUnread && (
                        <View style={styles.unreadBadge}>
                            {/* Punto indicador */}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function ConversationListScreen() {
    const { session, profile } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isFocused = useIsFocused();

    const fetchConversations = async () => {
        if (!session?.user?.id) return;

        // 1. Asegurar conversaciones creadas
        const { error: rpcError } = await supabase.rpc('create_conversations_for_my_contacts');
        if (rpcError) console.error('RPC Error:', rpcError.message);

        // 2. Obtener datos (incluyendo estado de lectura)
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                last_message_content,
                last_message_at,
                last_message_is_read,      
                last_message_sender_id,    
                client_id ( id, name, avatar_url ),
                vet_id ( id, name, avatar_url )
            `)
            .or(`client_id.eq.${session.user.id},vet_id.eq.${session.user.id}`)
            .order('last_message_at', { ascending: false, nulls: 'last' });

        if (error) {
            console.error('Fetch Error:', error.message);
        } else {
            setConversations(data);
            setFilteredConversations(data);
        }
        setLoading(false);
        setRefreshing(false);
    };

    // Filtro de búsqueda local
    const handleSearch = (text) => {
        setSearch(text);
        if (text.trim() === '') {
            setFilteredConversations(conversations);
        } else {
            const filtered = conversations.filter(item => {
                const otherUser = item.client_id?.id === session.user.id ? item.vet_id : item.client_id;
                return otherUser?.name?.toLowerCase().includes(text.toLowerCase());
            });
            setFilteredConversations(filtered);
        }
    };

    useEffect(() => {
        if (isFocused) {
            setLoading(true);
            fetchConversations();
        }
    }, [isFocused, session]);

    // Realtime
    useEffect(() => {
        if (!session?.user?.id) return;
        const channel = supabase
            .channel('conversations_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `client_id=eq.${session.user.id}` }, () => fetchConversations())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `vet_id=eq.${session.user.id}` }, () => fetchConversations())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [session]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchConversations();
    }, [session]);

    // --- UI DE CARGA ---
    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* HEADER CON BUSCADOR */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Mensajes</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.primary} style={{ opacity: 0.6 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar conversación..."
                        placeholderTextColor="#888"
                        value={search}
                        onChangeText={handleSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.gray || '#888'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* LISTA DE CHATS */}
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ConversationItem item={item} currentUserId={session.user.id} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.white}
                        colors={[COLORS.accent]}
                    />
                }
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={80} color={COLORS.secondary} />
                        <Text style={styles.emptyTitle}>¡Nada por aquí!</Text>
                        <Text style={styles.emptyText}>
                            {profile?.role?.name === 'cliente'
                                ? "Tus veterinarios aparecerán aquí cuando tengas citas o asignaciones."
                                : "Tus pacientes aparecerán aquí cuando tengas asignaciones."}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary, // Fondo oscuro/principal
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // HEADER
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: COLORS.primary,
    },
    headerTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h1,
        color: COLORS.white,
        marginBottom: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.black,
    },

    // LISTA
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },

    // TARJETA (CARD)
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
        // Sombras
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardUnread: {
        backgroundColor: '#F0FCFA', // Un tono muy suave del secondary/accent para resaltar
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },

    // AVATAR
    avatarContainer: {
        width: 55,
        height: 55,
        borderRadius: 28,
        backgroundColor: COLORS.secondary, // Fondo suave
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: COLORS.accent,
        overflow: 'hidden',
    },
    avatarText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: 22,
        color: COLORS.primary,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },

    // CONTENIDO DEL CARD
    contentContainer: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    userName: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body + 1,
        color: COLORS.primary,
        flex: 1,
    },
    userNameUnread: {
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.black,
    },
    timeText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 11,
        color: '#888',
        marginLeft: 10,
    },
    timeTextUnread: {
        color: COLORS.accent,
        fontFamily: FONTS.PoppinsSemiBold,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 13,
        color: '#666',
        flex: 1,
        marginRight: 10,
    },
    lastMessageUnread: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.primary,
    },
    unreadBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.red, // Punto rojo para llamar la atención
    },

    // EMPTY STATE
    emptyState: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h2,
        color: COLORS.secondary,
        marginTop: 15,
        marginBottom: 10,
    },
    emptyText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.textPrimary, // Color claro para contrastar con fondo oscuro
        textAlign: 'center',
        opacity: 0.8,
    },
});