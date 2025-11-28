import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, StatusBar, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { useAppointmentForm } from '../../hooks/useAppointmentForm';

// Componente para el selector modal
const ModalPicker = ({ label, selectedValue, onSelect, items, icon, placeholder, enabled = true }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const safeItems = items || [];
    const selectedLabel = safeItems.find(item => item.value === selectedValue)?.label || placeholder;

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[styles.pickerButton, !enabled && styles.disabledInput]}
                onPress={() => enabled && setModalVisible(true)}
                disabled={!enabled}
            >
                <Text style={[styles.pickerButtonText, selectedValue === null && { color: COLORS.secondary }]}>{selectedLabel}</Text>
                <Ionicons name={icon} size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Modal transparent={true} visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={safeItems}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item.value); setModalVisible(false); }}>
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.modalItemText}>No hay opciones disponibles.</Text>}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const DateTimeDisplay = ({ label, value, onPress, icon, format, enabled = true }) => (
    <View style={[styles.inputGroup, { flex: 1 }]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={[styles.dateInput, !enabled && styles.disabledInput]} onPress={onPress} disabled={!enabled}>
            <Text style={styles.dateInputText}>{value}</Text>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
        </TouchableOpacity>
    </View>
);


export default function SolicitarCita({ navigation }) {
    // Usar el Hook personalizado para manejar el formulario
    const { state, actions, selectors } = useAppointmentForm(navigation);
    const {
        loading, saving,
        selectedPetId, selectedType,
        isDateTimePickerVisible, dateTimePickerMode,
        date, time, reason
    } = state;


    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}><Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Solicitar Cita</Text>
                <View style={styles.headerButton} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

                    {/* FORMULARIO PRINCIPAL */}
                    <View style={styles.formCard}>
                        {/* Selector de Mascota */}
                        <ModalPicker
                            label="Mascota"
                            selectedValue={selectedPetId}
                            onSelect={actions.updatePetId}
                            items={selectors.petOptions}
                            icon="chevron-down"
                            placeholder={selectors.petOptions.length > 0 ? "Seleccionar mascota..." : "No tienes mascotas"}
                            enabled={selectors.petOptions.length > 0}
                        />

                        {/* Selector de Veterinario (Solo si no tiene asignado) */}
                        {selectors.needsVetSelection && (
                            <ModalPicker
                                label="Asignar Veterinario"
                                selectedValue={state.selectedVetId}
                                onSelect={actions.updateVetId}
                                items={selectors.vetOptions}
                                icon="person-add-outline"
                                placeholder="Seleccionar veterinario..."
                                enabled={true}
                            />
                        )}

                        {/* Selector de Tipo de Consulta */}
                        <ModalPicker
                            label="Tipo de Consulta"
                            selectedValue={selectedType}
                            onSelect={actions.updateServiceId}
                            items={selectors.serviceOptions}
                            icon="chevron-down"
                            placeholder="Seleccionar tipo..."
                            enabled={!!selectedPetId}
                        />

                        {/* Selectores de Fecha y Hora */}
                        <View style={styles.row}>
                            <DateTimeDisplay
                                label="Fecha Preferida"
                                value={selectors.displayDate}
                                onPress={() => actions.showPicker('date')}
                                icon="calendar-outline"
                                format="DD / MM / YYYY"
                                enabled={!!selectedType}
                            />
                            <DateTimeDisplay
                                label="Hora Preferida"
                                value={selectors.displayTime}
                                onPress={() => actions.showPicker('time')}
                                icon="time-outline"
                                format="HH:mm A"
                                enabled={!!selectedType}
                            />
                        </View>

                        {/* Motivo de la Consulta */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Motivo de la Consulta</Text>
                            <TextInput
                                style={[styles.input, !selectedType && styles.disabledInput]}
                                multiline
                                value={reason}
                                onChangeText={actions.updateReason}
                                placeholder="Describe brevemente los síntomas..."
                                placeholderTextColor={COLORS.secondary + '80'}
                                editable={!!selectedType}
                            />
                        </View>
                    </View>

                    {/* Mensaje Informativo */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
                        <Text style={styles.infoBoxText}>Tu solicitud será revisada por el veterinario asignado para confirmar la disponibilidad y la hora exacta.</Text>
                    </View>

                    {/* Botones de Acción */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, (!selectors.isFormValid || saving) && styles.submitButtonDisabled]}
                            onPress={actions.handleSubmit}
                            disabled={!selectors.isFormValid || saving}
                        >
                            {saving ?
                                <ActivityIndicator color={COLORS.white} />
                                : (
                                    <>
                                        <Ionicons name="send-outline" size={20} color={COLORS.white} />
                                        <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                                    </>
                                )
                            }
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* PICKER DE FECHA Y HORA */}
            {isDateTimePickerVisible && (
                <Modal transparent={true} animationType="fade" visible={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.datePickerContainer}>
                            <DateTimePicker
                                value={dateTimePickerMode === 'date' ? date : time}
                                mode={dateTimePickerMode}
                                display="spinner"
                                is24Hour={false}
                                onChange={actions.handlePickerChange}
                            />

                            <TouchableOpacity style={styles.closeButton} onPress={() => {
                                if (dateTimePickerMode === 'date') {
                                    actions.transitionToTimePicker();
                                } else {
                                    actions.closePickerAndSetTime();
                                }
                            }}>
                                <Text style={styles.closeButtonText}>
                                    {dateTimePickerMode === 'date' ? 'Siguiente (Seleccionar Hora)' : 'Confirmar Hora'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary },
    headerButton: { width: 30 },
    headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },
    scrollContent: { padding: 20, paddingBottom: 40, backgroundColor: COLORS.card },
    formCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 },
    inputGroup: { marginBottom: 15 },
    label: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.body, color: COLORS.primary, marginBottom: 5 },
    pickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: COLORS.secondary + '50' },
    pickerButtonText: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.primary },
    dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 15, height: 50, flex: 1, borderWidth: 1, borderColor: COLORS.secondary + '50' },
    dateInputText: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.primary },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 15, fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.primary, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.secondary + '50' },
    disabledInput: { backgroundColor: COLORS.secondary + '10', opacity: 0.7 },
    infoBox: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 12, padding: 15, marginTop: 10, marginBottom: 20, alignItems: 'center' },
    infoBoxText: { flex: 1, marginLeft: 10, fontFamily: FONTS.PoppinsRegular, color: COLORS.primary, fontSize: SIZES.caption },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    cancelButton: { flex: 0.45, alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary + '50' },
    cancelButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.primary, fontSize: SIZES.body },
    submitButton: { flex: 0.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, backgroundColor: COLORS.primary, },
    submitButtonText: { fontFamily: FONTS.PoppinsBold, color: COLORS.card, fontSize: SIZES.body, marginLeft: 10 },
    submitButtonDisabled: { opacity: 0.5, backgroundColor: COLORS.secondary + '80' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 10, width: '80%', maxHeight: '60%' },
    modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.secondary + '50' },
    modalItemText: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.h3, color: COLORS.primary, textAlign: 'center' },
    datePickerContainer: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, width: '90%', alignItems: 'center' },
    closeButton: { marginTop: 10, padding: 12, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 20, width: '100%' },
    closeButtonText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.white },
});