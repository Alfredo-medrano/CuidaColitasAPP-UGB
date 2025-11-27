import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize } from '../../utils/helpers';
import moment from 'moment';

export default function AdminMensajes({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);

            // Obtener todas las conversaciones del sistema usando la tabla conversations
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          id,
          last_message_content,
          last_message_at,
          last_message_is_read,
          last_message_sender_id,
          client_id ( id, name ),
          vet_id ( id, name )
        `)
                .order('last_message_at', { ascending: false, nulls: 'last' });

            if (error) throw error;

            setConversations(data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const handleConversationPress = (conversation) => {
        // Navegar al chat de esta conversación
        navigation.navigate('ChatScreen', {
            conversation_id: conversation.id,
            other_user_name: `${conversation.client_id?.name || 'Cliente'} y ${conversation.vet_id?.name || 'Veterinario'}`,
            other_user_id: conversation.vet_id?.id || conversation.client_id?.id,
        });
    };

    const renderConversation = ({ item }) => {
        if (!item.client_id || !item.vet_id) return null;

        return (
            <TouchableOpacity
                style={styles.conversationCard}
                onPress={() => handleConversationPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Ionicons name="chatbubbles" size={24} color={COLORS.accent} />
                    </View>
                    {!item.last_message_is_read && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>!</Text>
                        </View>
                    )}
                </View>

                <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {item.client_id.name} ↔ {item.vet_id.name}
                        </Text>
                        <Text style={styles.timeText}>
                            {item.last_message_at ? moment(item.last_message_at).fromNow() : ''}
                        </Text>
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={2}>
                        {item.last_message_content || 'Sin mensajes aún'}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>No hay conversaciones</Text>
            <Text style={styles.emptyText}>
                Las conversaciones entre usuarios aparecerán aquí
            </Text>
        </View>
    );

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mensajería del Sistema</Text>
                <Text style={styles.headerSubtitle}>
                    {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
                </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.accent}
                            colors={[COLORS.accent]}
                        />
                    }
                />
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: responsiveSize(20),
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(4),
    },
    headerSubtitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveSize(40),
    },
    listContent: {
        paddingBottom: responsiveSize(20),
    },
    conversationCard: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        marginBottom: responsiveSize(12),
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: responsiveSize(12),
    },
    avatar: {
        width: responsiveSize(50),
        height: responsiveSize(50),
        borderRadius: responsiveSize(25),
        backgroundColor: COLORS.accent + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.red,
        borderRadius: responsiveSize(10),
        minWidth: responsiveSize(20),
        height: responsiveSize(20),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsiveSize(6),
    },
    badgeText: {
        color: COLORS.white,
        fontSize: SIZES.caption - 2,
        fontFamily: FONTS.PoppinsBold,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveSize(4),
    },
    userName: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
        flex: 1,
        marginRight: responsiveSize(8),
    },
    timeText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    lastMessage: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'AA',
        marginBottom: responsiveSize(4),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveSize(60),
    },
    emptyTitle: {
        fontSize: SIZES.h3,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginTop: responsiveSize(16),
        marginBottom: responsiveSize(8),
    },
    emptyText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        textAlign: 'center',
        paddingHorizontal: responsiveSize(40),
    },
});
