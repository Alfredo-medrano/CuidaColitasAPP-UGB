import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Platform, TouchableOpacity, StatusBar, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { supabase } from '../../api/Supabase';
import { Ionicons } from '@expo/vector-icons'; 
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 
import { SafeAreaView } from 'react-native-safe-area-context';

// --- UTILITIES (ISO 25010: DRY) ---
const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let ageInYears = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        ageInYears--;
    }
    return `${ageInYears} años`;
};

// --- Componente Modular: FormInput (DRY) ---
const FormInput = ({ label, value, onChangeText, placeholder, editable, multiline = false, keyboardType = 'default', isInvalid = false, ...props }) => ( // ⭐️ Agregado isInvalid
    <View style={detailsStyles.inputGroup}>
        <Text style={detailsStyles.inputLabel}>{label}</Text>
        <TextInput
            style={[
                detailsStyles.input, 
                !editable && detailsStyles.inputReadOnly, 
                multiline && detailsStyles.inputMultiline,
                isInvalid && detailsStyles.inputInvalid // ⭐️ Estilo de error
            ]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.card}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            multiline={multiline}
            keyboardType={keyboardType}
            {...props}
        />
    </View>
);

// ⭐️ Componente Modular: DropdownSelector (Lista Desplegable)
const DropdownSelector = ({ label, selectedValue, onSelect, items, editable, placeholder = "Seleccionar", isInvalid = false }) => { // ⭐️ Agregado isInvalid
    const [modalVisible, setModalVisible] = useState(false);
    const selectedItem = items.find(item => item.value === selectedValue) || { label: placeholder, value: null };

    const handleSelection = (item) => {
        onSelect(item.value);
        setModalVisible(false);
    };

    return (
        <View style={detailsStyles.inputGroup}>
            <Text style={detailsStyles.inputLabel}>{label}</Text>
            <TouchableOpacity
                style={[
                    detailsStyles.dropdownButton, 
                    !editable && detailsStyles.inputReadOnly,
                    isInvalid && detailsStyles.inputInvalid // ⭐️ Estilo de error
                ]}
                onPress={() => editable && setModalVisible(true)}
                disabled={!editable}
            >
                <Text style={detailsStyles.dropdownText}>{selectedItem.label}</Text>
                {editable && <Ionicons name="caret-down" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={detailsStyles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={detailsStyles.dropdownModal} onTouchStart={(e) => e.stopPropagation()}> 
                        <FlatList
                            data={items}
                            keyExtractor={item => item.key || item.value}
                            renderItem={({ item }) => (
                                <Pressable style={detailsStyles.dropdownItem} onPress={() => handleSelection(item)}>
                                    <Text style={detailsStyles.dropdownItemText}>{item.label}</Text>
                                </Pressable>
                            )}
                            ListHeaderComponent={<Text style={detailsStyles.dropdownHeader}>Selecciona {label}</Text>}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};


// --- Componente Principal ---

export default function DetallePaciente({ navigation, route }) {
    const { petId, mode, userRole } = route.params; 
    const [petName, setPetName] = useState('');
    const [speciesId, setSpeciesId] = useState(null);
    const [breed, setBreed] = useState('');
    const [sex, setSex] = useState('');
    const [birthDate, setBirthDate] = useState(new Date()); 
    const [showDatePicker, setShowDatePicker] = useState(false); 
    const [tempBirthDate, setTempBirthDate] = useState(new Date()); 
    const [weightKg, setWeightKg] = useState('');
    const [color, setColor] = useState('');
    const [isNeutered, setIsNeutered] = useState(false);
    
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');

    const [speciesList, setSpeciesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(mode === 'edit');

    // ⭐️ NUEVO ESTADO: Para manejar errores de validación y resaltado
    const [validationErrors, setValidationErrors] = useState({}); 
    
    // Lista de opciones de Sexo
    const sexOptions = [
        { label: "Seleccionar sexo...", value: "", key: 'sex-placeholder' },
        { label: "Macho", value: "Macho", key: 'sex-macho' },
        { label: "Hembra", value: "Hembra", key: 'sex-hembra' },
    ];
    
    // useMemo para calcular las opciones de especies
    const speciesOptions = useMemo(() => {
        const defaultOption = { label: "Seleccionar especie...", value: null, key: 'specie-placeholder' };
        return [defaultOption, ...speciesList.map(s => ({ label: s.name, value: s.id, key: s.id }))];
    }, [speciesList]);


    // Cargar detalles de la mascota y del dueño (ISO 25012: Precisión)
    useEffect(() => {
        const loadPetDetails = async () => {
            try {
                setLoading(true);

                // 1. Obtener lista de especies (Catálogo)
                const { data: speciesData, error: speciesError } = await supabase.from('pet_species').select('id, name');
                if (speciesError) throw speciesError;
                setSpeciesList(speciesData);

                // 2. Obtener datos de la mascota y su dueño (Solo nombre y teléfono)
                const { data: petData, error: petError } = await supabase
                    .from('pets')
                    .select(`
                        *, 
                        species:pet_species(id, name), 
                        owner:profiles!owner_id(id, name, phone_number) 
                    `)
                    .eq('id', petId)
                    .single();
                if (petError) throw petError;
                
                // Mapeo de datos de la mascota
                setPetName(petData.name);
                setSpeciesId(petData.species_id);
                setBreed(petData.breed || '');
                setSex(petData.sex || '');
                const fetchedBirthDate = petData.birth_date ? new Date(petData.birth_date) : new Date();
                setBirthDate(fetchedBirthDate);
                setTempBirthDate(fetchedBirthDate);
                setWeightKg(petData.weight_kg ? String(petData.weight_kg) : '');
                setColor(petData.color || '');
                setIsNeutered(petData.is_neutered);
                
                // Datos del Dueño
                setOwnerName(petData.owner.name);
                setOwnerPhone(petData.owner.phone_number || 'Teléfono no registrado');
                // Email no se carga ni se muestra.

                // 3. CONSULTA PARA EL ÚLTIMO DIAGNÓSTICO (ISO 25012)
                const { data: recordData, error: recordError } = await supabase
                    .from('appointments')
                    .select(`
                        medical_records(diagnosis, treatment)
                    `)
                    .eq('pet_id', petId)
                    .order('appointment_time', { ascending: false })
                    .limit(1)
                    .single();

                if (recordError && recordError.code !== 'PGRST116') throw recordError;

                if (recordData && recordData.medical_records && recordData.medical_records[0]) {
                    const lastRecord = recordData.medical_records[0];
                    setDiagnosis(lastRecord.diagnosis || 'Sin historial médico registrado');
                    setTreatment(lastRecord.treatment || 'Sin historial médico registrado');
                } else {
                    setDiagnosis('Sin historial médico registrado');
                    setTreatment('Sin historial médico registrado');
                }

            } catch (error) {
                Alert.alert("Error", "No se pudo cargar la información del paciente.");
                console.error("Error DetallePaciente:", error.message);
            } finally {
                setLoading(false);
            }
        };

        if (petId) loadPetDetails();
        else setLoading(false);
    }, [petId]);


    // FUNCIÓN DE CONFIRMACIÓN DE FECHA
    const handleDateChangeConfirmation = useCallback((newDate) => {
        Alert.alert(
            "Confirmar Cambio",
            `¿Deseas cambiar la fecha de nacimiento a ${newDate.toLocaleDateString('es-ES')}?`,
            [
                { text: "Cancelar", style: "cancel", onPress: () => setShowDatePicker(false) },
                { text: "Cambiar", style: 'default', onPress: () => {
                    setBirthDate(newDate); 
                    setTempBirthDate(newDate); 
                    setShowDatePicker(false);
                }},
            ]
        );
    }, []);

    // FUNCIÓN onChangeDate
    const onChangeDate = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        
        if (selectedDate) {
            setTempBirthDate(selectedDate);
            
            if (event.type === 'set' || Platform.OS === 'ios') {
                handleDateChangeConfirmation(selectedDate);
            }
        }
    };
    // ------------------------------------

    // ⭐️ FUNCIÓN DE GUARDADO CON VALIDACIÓN VISUAL ⭐️
    const handleUpdatePet = async () => {
        // Reiniciar errores y recopilar los nuevos
        const errors = {};
        
        if (!petName.trim()) errors.petName = true;
        if (!speciesId) errors.speciesId = true;
        if (!breed.trim()) errors.breed = true;
        if (!sex) errors.sex = true;

        setValidationErrors(errors); // Establecer errores para el feedback visual

        if (Object.keys(errors).length > 0) {
            Alert.alert("Error de Validación", "Por favor, complete todos los campos obligatorios marcados en rojo.");
            return; 
        }

        setSaving(true);
        // La lógica de guardado sigue siendo la misma...
        try {
            const updates = {
                name: petName,
                species_id: speciesId,
                breed: breed,
                sex: sex,
                birth_date: birthDate.toISOString().split('T')[0], 
                weight_kg: parseFloat(weightKg) || null,
                color: color,
                is_neutered: isNeutered,
                updated_at: new Date(),
            };

            const { error: petError } = await supabase.from('pets').update(updates).eq('id', petId);
            if (petError) throw petError;
            
            Alert.alert("Éxito", "Información del paciente actualizada.");
            setIsEditing(false);
            navigation.goBack();
        } catch (error) {
            console.error('Error al actualizar el paciente:', error.message);
            Alert.alert("Error", "Hubo un problema al actualizar el paciente.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={[detailsStyles.safeContainer, detailsStyles.centered]}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }
    
    const calculatedAge = calculateAge(birthDate);

    return (
        <SafeAreaView style={detailsStyles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
            <ScrollView contentContainerStyle={detailsStyles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* --- HEADER --- */}
                <View style={detailsStyles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={detailsStyles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </Pressable>
                    <Text style={detailsStyles.headerTitle}>{isEditing ? 'Editar Paciente' : 'Detalle de Paciente'}</Text>
                    
                    {(mode === 'view' || !isEditing) && (
                        <Pressable style={detailsStyles.editButton} onPress={() => setIsEditing(true)}>
                            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                            <Text style={detailsStyles.editButtonText}>Editar</Text>
                        </Pressable>
                    )}
                    {(isEditing || mode === 'edit') && <View style={detailsStyles.editButtonPlaceholder} />}
                </View>

                {/* --- 🐶 1. Información de la Mascota --- */}
                <View style={[detailsStyles.formGroup, { backgroundColor: COLORS.white }]}>
                    <Text style={detailsStyles.groupTitle}>Información de la Mascota</Text>
                    
                    <FormInput 
                        label="Nombre de la mascota" 
                        value={petName} 
                        onChangeText={setPetName} 
                        editable={isEditing} 
                        isInvalid={validationErrors.petName} // ⭐️ Validación
                    />
                    <FormInput 
                        label="Raza" 
                        value={breed} 
                        onChangeText={setBreed} 
                        editable={isEditing} 
                        placeholder="Siamés" 
                        isInvalid={validationErrors.breed} // ⭐️ Validación
                    />

                    {/* Especie y Sexo (Dropdowns) */}
                    <View style={detailsStyles.pickerRow}>
                        
                        {/* Especie (Lista de la BD) */}
                        <View style={detailsStyles.pickerWrapper}>
                            <DropdownSelector
                                label="Especie"
                                selectedValue={speciesId}
                                onSelect={setSpeciesId}
                                editable={isEditing}
                                items={speciesOptions}
                                isInvalid={validationErrors.speciesId} // ⭐️ Validación
                            />
                        </View>

                        {/* Sexo (Lista Fija) */}
                        <View style={detailsStyles.pickerWrapper}>
                            <DropdownSelector
                                label="Sexo"
                                selectedValue={sex}
                                onSelect={setSex}
                                editable={isEditing}
                                items={sexOptions}
                                isInvalid={validationErrors.sex} // ⭐️ Validación
                            />
                        </View>
                    </View>

                    {/* Edad calculada y Fecha de Nacimiento */}
                    <FormInput label="Edad calculada" value={calculatedAge} editable={false} />

                    <View style={detailsStyles.pickerRow}>
                        <FormInput 
                            label="Fecha de Nacimiento"
                            value={birthDate.toLocaleDateString('es-ES')}
                            editable={false}
                        />
                        {/* ⭐️ Botón Responsivo */}
                        <TouchableOpacity onPress={() => isEditing && setShowDatePicker(true)} disabled={!isEditing} style={[detailsStyles.datePickerButton, !isEditing && detailsStyles.inputReadOnly]}>
                            <Text style={detailsStyles.datePickerButtonText}>Cambiar Fecha</Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={tempBirthDate}
                            mode={'date'}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* Peso, Color */}
                    <View style={detailsStyles.pickerRow}>
                        <FormInput label="Peso (kg)" value={weightKg} onChangeText={setWeightKg} editable={isEditing} keyboardType="numeric" />
                        <FormInput label="Color" value={color} onChangeText={setColor} editable={isEditing} />
                    </View>
                    
                    {/* Esterilizado Checkbox */}
                    <View style={detailsStyles.checkboxContainer}>
                        <Text style={detailsStyles.checkboxLabel}>Esterilizado/a:</Text>
                        <Pressable
                            style={[detailsStyles.checkbox, isNeutered && detailsStyles.checkboxChecked]}
                            onPress={() => isEditing && setIsNeutered(!isNeutered)}
                            disabled={!isEditing}
                        >
                            {isNeutered && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                        </Pressable>
                    </View>
                </View>

                {/* --- 👩‍🦰 2. Información del Dueño (Solo Lectura) --- */}
                <View style={detailsStyles.formGroup}>
                    <Text style={detailsStyles.groupTitle}>Información del Dueño</Text>
                    <FormInput label="Nombre del Dueño" value={ownerName} editable={false} />
                    <FormInput label="Teléfono" value={ownerPhone} editable={false} keyboardType="phone-pad" />
                </View>

                {/* --- 🩺 3. Estado Médico Inicial (DATOS REALES DEL ÚLTIMO REGISTRO) --- */}
                <View style={detailsStyles.formGroup}>
                    <Text style={detailsStyles.groupTitle}>Estado Médico Inicial</Text>
                    <FormInput 
                        label="Diagnóstico actual" 
                        value={diagnosis} 
                        onChangeText={setDiagnosis} 
                        editable={isEditing} 
                        multiline={true}
                    />
                    <FormInput 
                        label="Tratamiento actual" 
                        value={treatment} 
                        onChangeText={setTreatment} 
                        editable={isEditing} 
                        multiline={true}
                    />
                </View>


                {/* --- BOTONES DE ACCIÓN --- */}
                {isEditing && (
                    <View style={detailsStyles.buttonsContainer}>
                        <Pressable style={detailsStyles.cancelButton} onPress={() => {
                            if (mode === 'edit') navigation.goBack(); 
                            else setIsEditing(false);
                        }} disabled={saving}>
                            <Text style={detailsStyles.cancelButtonText}>Cancelar</Text>
                        </Pressable>
                        <Pressable style={[detailsStyles.createButton, saving && detailsStyles.buttonDisabled]} onPress={handleUpdatePet} disabled={saving}>
                            {saving ? <ActivityIndicator color={COLORS.primary} /> : (
                                <>
                                    <Ionicons name="checkmark" size={20} color={COLORS.primary} style={{marginRight: 5}} />
                                    <Text style={detailsStyles.createButtonText}>Guardar Cambios</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// --- ESTILOS ---

const detailsStyles = StyleSheet.create({
    safeContainer: { 
        flex: 1, 
        backgroundColor: COLORS.primary 
    },
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 40,
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 15, 
    },
    backButton: { 
        padding: 5 
    },
    headerTitle: { 
        fontSize: SIZES.h2, 
        fontFamily: FONTS.PoppinsBold, 
        color: COLORS.primary 
    },
    editButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.accent, 
        borderRadius: 20, 
        paddingHorizontal: 10, 
        paddingVertical: 5 
    },
    editButtonText: { 
        color: COLORS.primary, 
        marginLeft: 5, 
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
    },
    editButtonPlaceholder: { 
        width: 70 
    }, 
    formGroup: { 
        marginBottom: 20, 
        backgroundColor: COLORS.white, 
        padding: 15, 
        borderRadius: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    groupTitle: { 
        fontSize: SIZES.h3, 
        fontFamily: FONTS.PoppinsSemiBold, 
        color: COLORS.card, 
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
        paddingBottom: 5,
    },
    inputGroup: { 
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular, 
        color: COLORS.primary, 
        marginBottom: 4,
    },
    input: { 
        minHeight: 50,
        borderColor: COLORS.secondary, 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        marginBottom: 5, 
        backgroundColor: COLORS.textPrimary, 
        fontSize: SIZES.body,
        color: COLORS.primary,
        fontFamily: FONTS.PoppinsRegular,
    },
    inputReadOnly: {
        backgroundColor: COLORS.secondary,
    },
    inputMultiline: {
        minHeight: 100, 
        textAlignVertical: 'top',
        paddingVertical: 15,
    },
    // ⭐️ Nuevo estilo de Validación
    inputInvalid: { 
        borderColor: COLORS.red,
        borderWidth: 2, 
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    pickerWrapper: {
        flex: 1,
        marginRight: 10,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 50,
        borderColor: COLORS.secondary, 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        marginBottom: 5, 
        backgroundColor: COLORS.textPrimary, 
    },
    dropdownText: {
        fontSize: SIZES.body,
        color: COLORS.primary,
        fontFamily: FONTS.PoppinsRegular,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dropdownModal: {
        width: '80%',
        maxHeight: '70%',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 10,
    },
    dropdownHeader: {
        fontSize: SIZES.h3,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.primary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
        marginBottom: 5,
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
    },
    dropdownItemText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.primary,
    },
    // ⭐️ Botón Responsivo FIX
    datePickerButton: {
        backgroundColor: COLORS.card,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        flex: 1,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.secondary,
        marginLeft: 10,
    },
    datePickerButtonText: {
        color: COLORS.textPrimary,
        fontFamily: FONTS.PoppinsSemiBold,
    },
    checkboxContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 10,
    },
    checkboxLabel: { 
        fontSize: SIZES.body, 
        marginRight: 15, 
        color: COLORS.primary,
        fontFamily: FONTS.PoppinsRegular,
    },
    checkbox: { 
        width: 25, 
        height: 25, 
        borderWidth: 2, 
        borderColor: COLORS.primary, 
        borderRadius: 4, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
    },
    checkboxChecked: { 
        backgroundColor: COLORS.accent, 
        borderColor: COLORS.accent 
    },
    buttonsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        gap: 15, 
        marginTop: 10 
    },
    createButton: { 
        backgroundColor: COLORS.accent, 
        padding: 15, 
        borderRadius: 12, 
        flex: 1, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    cancelButton: { 
        backgroundColor: COLORS.white, 
        padding: 15, 
        borderRadius: 12, 
        flex: 1, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    createButtonText: { 
        color: COLORS.primary, 
        fontFamily: FONTS.PoppinsSemiBold, 
        fontSize: SIZES.h3,
    },
    cancelButtonText: { 
        color: COLORS.primary, 
        fontFamily: FONTS.PoppinsSemiBold, 
        fontSize: SIZES.h3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});