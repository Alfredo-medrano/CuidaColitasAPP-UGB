import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { responsiveSize } from '../../utils/helpers';

export default function ConfiguracionSistema({ navigation }) {
    // Estados de configuración (en producción estos vendrían de BD)
    const [config, setConfig] = useState({
        allowNewRegistrations: true,
        requireEmailVerification: false,
        enableNotifications: true,
        enableRealtime: true,
        maintenanceMode: false,
        autoBackup: true,
    });

    const handleToggle = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
        Alert.alert('Configuración', `${key} actualizado`);
    };

    const ConfigSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.card}>{children}</View>
        </View>
    );

    const ConfigItem = ({ icon, label, value, onToggle, color = COLORS.accent }) => (
        <View style={styles.configItem}>
            <View style={styles.configLeft}>
                <View style={[styles.configIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.configLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#D1D5DB', true: color + '80' }}
                thumbColor={value ? color : '#F3F4F6'}
            />
        </View>
    );

    const InfoCard = ({ icon, title, value, color }) => (
        <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <AdminLayout navigation={navigation}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Configuración del Sistema</Text>
                    <Text style={styles.headerSubtitle}>Ajustes generales de la aplicación</Text>
                </View>

                {/* Información General */}
                <ConfigSection title="Información del Sistema">
                    <InfoCard
                        icon="server"
                        title="Estado del Sistema"
                        value={config.maintenanceMode ? 'Mantenimiento' : 'Operativo'}
                        color={config.maintenanceMode ? '#EF4444' : '#10B981'}
                    />
                    <InfoCard
                        icon="shield-checkmark"
                        title="Versión"
                        value="1.0.0"
                        color={COLORS.card}
                    />
                    <InfoCard
                        icon="cloud-done"
                        title="Base de Datos"
                        value="Supabase PostgreSQL"
                        color={COLORS.accent}
                    />
                </ConfigSection>

                {/* Configuración de Usuarios */}
                <ConfigSection title="Gestión de Usuarios">
                    <ConfigItem
                        icon="person-add"
                        label="Permitir nuevos registros"
                        value={config.allowNewRegistrations}
                        onToggle={() => handleToggle('allowNewRegistrations')}
                        color={COLORS.accent}
                    />
                    <ConfigItem
                        icon="mail"
                        label="Requeririr verificación de email"
                        value={config.requireEmailVerification}
                        onToggle={() => handleToggle('requireEmailVerification')}
                        color="#F59E0B"
                    />
                </ConfigSection>

                {/* Configuración del Sistema */}
                <ConfigSection title="Sistema">
                    <ConfigItem
                        icon="notifications"
                        label="Notificaciones push"
                        value={config.enableNotifications}
                        onToggle={() => handleToggle('enableNotifications')}
                        color={COLORS.card}
                    />
                    <ConfigItem
                        icon="flash"
                        label="Actualización en tiempo real"
                        value={config.enableRealtime}
                        onToggle={() => handleToggle('enableRealtime')}
                        color="#6366F1"
                    />
                    <ConfigItem
                        icon="save"
                        label="Respaldo automático"
                        value={config.autoBackup}
                        onToggle={() => handleToggle('autoBackup')}
                        color="#10B981"
                    />
                    <ConfigItem
                        icon="construct"
                        label="Modo mantenimiento"
                        value={config.maintenanceMode}
                        onToggle={() => handleToggle('maintenanceMode')}
                        color="#EF4444"
                    />
                </ConfigSection>

                {/* Acciones del Sistema */}
                <ConfigSection title="Acciones">
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="download" size={20} color={COLORS.white} />
                        <Text style={styles.actionText}>Exportar Datos del Sistema</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
                        <Ionicons name="refresh" size={20} color={COLORS.card} />
                        <Text style={[styles.actionText, { color: COLORS.card }]}>Limpiar Caché</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]}>
                        <Ionicons name="trash" size={20} color={COLORS.white} />
                        <Text style={styles.actionText}>Limpiar Logs Antiguos</Text>
                    </TouchableOpacity>
                </ConfigSection>

                {/* Info Footer */}
                <View style={styles.footer}>
                    <Ionicons name="information-circle" size={16} color={COLORS.secondary} />
                    <Text style={styles.footerText}>
                        Los cambios en la configuración afectan a todo el sistema
                    </Text>
                </View>
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: responsiveSize(20),
    },
    header: {
        marginBottom: responsiveSize(24),
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
    section: {
        marginBottom: responsiveSize(24),
    },
    sectionTitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(12),
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        ...SHADOWS.light,
    },
    configItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: responsiveSize(12),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary + '20',
    },
    configLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    configIcon: {
        width: responsiveSize(36),
        height: responsiveSize(36),
        borderRadius: responsiveSize(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(12),
    },
    configLabel: {
        fontSize: SIZES.caption + 1,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black,
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: responsiveSize(12),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary + '20',
    },
    infoIcon: {
        width: responsiveSize(48),
        height: responsiveSize(48),
        borderRadius: responsiveSize(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(12),
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'AA',
        marginBottom: responsiveSize(2),
    },
    infoValue: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.accent,
        paddingVertical: responsiveSize(14),
        borderRadius: responsiveSize(10),
        marginBottom: responsiveSize(12),
        gap: responsiveSize(8),
    },
    actionButtonSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    actionButtonDanger: {
        backgroundColor: '#EF4444',
    },
    actionText: {
        fontSize: SIZES.caption + 1,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.white,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary + '20',
        padding: responsiveSize(12),
        borderRadius: responsiveSize(8),
        gap: responsiveSize(8),
    },
    footerText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'AA',
        flex: 1,
    },
});
