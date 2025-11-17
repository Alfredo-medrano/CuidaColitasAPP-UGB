// src/screens/Chat/ConversationListScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase'; // [cite: uploaded:alfredo-medrano/cuidacolitasapp-ugb/CuidaColitasAPP-UGB-feeb023817b54d78f80034865c5fbb3492e0b009/src/api/Supabase.js]
import { useAuth } from '../../context/AuthContext'; // [cite: uploaded:alfredo-medrano/cuidacolitasapp-ugb/CuidaColitasAPP-UGB-feeb023817b54d78f80034865c5fbb3492e0b009/src/context/AuthContext.js]
import { COLORS, FONTS, SIZES } from '../../theme/theme'; // [cite: uploaded:alfredo-medrano/cuidacolitasapp-ugb/CuidaColitasAPP-UGB-feeb023817b54d78f80034865c5fbb3492e0b009/src/theme/theme.js]

// Un componente simple para mostrar cada conversación en la lista
const ConversationItem = ({ item, currentUserId }) => {
    const navigation = useNavigation();

    // Determina quién es la "otra" persona en el chat
    // Asegurándonos que otherUser no sea null
    const otherUser = item.client_id?.id === currentUserId ? item.vet_id : item.client_id;

    // Si por alguna razón el otro usuario no carga, no mostramos el item
    if (!otherUser) {
        return null;
    }

    // Función para navegar a la pantalla de chat
    const goToChat = () => {
        navigation.navigate('ChatScreen', {
            conversation_id: item.id,
            other_user_name: otherUser.name,
        });
    };

    return (
        <TouchableOpacity style={styles.chatItem} onPress={goToChat}>
            <View style={styles.avatar}>
                {/* Aquí puedes poner la imagen de avatar si la tienes */}
                <Text style={styles.avatarText}>{otherUser.name ? otherUser.name.charAt(0) : '?'}</Text>
            </View>
            <View style={styles.chatContent}>
                <Text style={styles.userName}>{otherUser.name}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message_content || 'Inicia la conversación...'}
                </Text>
            </View>
            <Text style={styles.time}>
                {item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
        </TouchableOpacity>
    );
};

// Pantalla principal de la lista de chats
export default function ConversationListScreen() {
    const { session, profile } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isFocused = useIsFocused();

    // Función para cargar las conversaciones
    const fetchConversations = async () => {
        if (!session?.user?.id) return;

        // ----- MODIFICACIÓN 1: LLAMAR RPC -----
        // Primero, llamamos a la función de la BD para que cree las conversaciones
        // que falten (basadas en mascotas/veterinarios).
        const { error: rpcError } = await supabase.rpc('create_conversations_for_my_contacts');
        if (rpcError) {
            console.error('Error creando conversaciones automáticas:', rpcError.message);
        }
        // ----------------------------------------

        // Hacemos un 'join' para obtener los datos de los perfiles de cliente y veterinario
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                last_message_content,
                last_message_at,
                client_id ( id, name, avatar_url ),
                vet_id ( id, name, avatar_url )
            `)
            .or(`client_id.eq.${session.user.id},vet_id.eq.${session.user.id}`)
            // ----- MODIFICACIÓN 2: ORDENAMIENTO -----
            // 'nulls: 'last'' envía las conversaciones nuevas (vacías) al final.
            .order('last_message_at', { ascending: false, nulls: 'last' });

        if (error) {
            console.error('Error fetching conversations:', error.message);
        } else {
            setConversations(data);
        }
        setLoading(false);
        setRefreshing(false);
    };

    // Cargar conversaciones cuando la pantalla se muestra
    useEffect(() => {
        if (isFocused) {
            setLoading(true);
            fetchConversations();
        }
    }, [isFocused, session]);

    // Suscripción a Realtime
    useEffect(() => {
        if (!session?.user?.id) return;

        // Escuchamos cambios en la tabla 'conversations'
        const channel = supabase
            .channel('public:conversations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    // Filtramos para solo escuchar cambios que nos involucren
                    filter: `client_id=eq.${session.user.id}`
                },
                (payload) => {
                    console.log('Cambio recibido en conversations (cliente)!', payload);
                    // Cuando hay un cambio, simplemente volvemos a cargar todo
                    fetchConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `vet_id=eq.${session.user.id}`
                },
                (payload) => {
                    console.log('Cambio recibido en conversations (vet)!', payload);
                    fetchConversations();
                }
            )
            .subscribe();

        // Limpiamos la suscripción al salir de la pantalla
        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchConversations();
    }, [session]);

    if (loading) {
        return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color={COLORS.primary} />;
    }

    return (
        <View style={styles.container}>
            {conversations.length === 0 ? (
                // ----- MODIFICACIÓN 3: MENSAJE DE AYUDA -----
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tienes conversaciones activas.</Text>
                    {/* Asumimos que `profile.role.name` está disponible gracias a la consulta en `Home.js` */}
                    {profile?.role?.name === 'cliente' && (
                        <Text style={styles.emptySubText}>
                            Cuando asignes un veterinario principal a tus mascotas, aparecerá aquí para chatear.
                        </Text>
                    )}
                    {profile?.role?.name === 'veterinario' && (
                        <Text style={styles.emptySubText}>
                            Cuando tengas mascotas asignadas como su veterinario principal, sus dueños aparecerán aquí.
                        </Text>
                    )}
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ConversationItem item={item} currentUserId={session.user.id} />
                    )}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.lightGray, // Un color de fondo suave
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.padding,
    },
    avatarText: {
        color: COLORS.white,
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.textPrimary,
    },
    lastMessage: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.textSecondary,
    },
    time: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding * 2,
    },
    emptyText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    emptySubText: { // Estilo nuevo para el texto de ayuda
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SIZES.base,
    },
});