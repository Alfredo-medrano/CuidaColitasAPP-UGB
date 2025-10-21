// src/hooks/useAppointmentForm.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/Supabase';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

// Constantes de Configuración
const APPOINTMENT_DURATION_MINUTES = 30;
const SERVICE_CATEGORIES = [
    { id: 'general', name: 'Consulta General' },
    { id: 'vaccine', name: 'Vacunación' },
    { id: 'checkup', name: 'Chequeo / Control' },
    { id: 'symptoms', name: 'Sintomatología específica' },
];

export function useAppointmentForm(navigation) {
    // ----------------------
    // ESTADO DEL FORMULARIO
    // ----------------------
    const [pets, setPets] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [reason, setReason] = useState('');
    
    // Estados de UI/Fetch
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isTimeSet, setIsTimeSet] = useState(false);
    const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
    const [dateTimePickerMode, setDateTimePickerMode] = useState('date');


    // ----------------------
    // SELECTORES (useMemo)
    // ----------------------
    const selectedPet = useMemo(() => pets.find(p => p.id === selectedPetId), [selectedPetId, pets]);
    
    const petOptions = useMemo(() => {
        return (pets || []).map(p => ({ label: p.name, value: p.id }));
    }, [pets]);

    const serviceOptions = useMemo(() => {
        return (SERVICE_CATEGORIES || []).map(s => ({ label: s.name, value: s.id }));
    }, []);

    const isFormValid = useMemo(() => {
        return selectedPetId && selectedType && reason.trim() && isTimeSet;
    }, [selectedPetId, selectedType, reason, isTimeSet]);
    

    // ----------------------
    // LÓGICA DE FETCH (SIMPLIFICADA)
    // ----------------------
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            // Solo necesitamos cargar las mascotas del cliente
            const { data: petData, error: petError } = await supabase.from('pets').select('id, name, primary_vet_id').eq('owner_id', user.id);
            if (petError) throw petError;
            setPets(petData || []);

        } catch (error) {
            console.error("Error cargando datos iniciales:", error.message);
            Alert.alert("Error", "No se pudieron cargar los datos necesarios para el formulario.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // ----------------------
    // LÓGICA DE DISPONIBILIDAD Y SUBIDA
    // ----------------------
    const checkAppointmentConflict = useCallback(async (vetId, appointmentTime) => {
        const endTime = moment(appointmentTime).add(APPOINTMENT_DURATION_MINUTES, 'minutes').toISOString();
        
        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('vet_id', vetId)
            .gte('appointment_time', appointmentTime.toISOString())
            .lt('appointment_time', endTime);

        if (error) throw error;
        return existingAppointments && existingAppointments.length > 0;
    }, []);


    const handleSubmit = useCallback(async () => {
        if (!isFormValid) {
            Alert.alert("Campos incompletos", "Por favor, completa todos los campos del formulario.");
            return;
        }
        if (!selectedPet?.primary_vet_id) {
            Alert.alert("Error", "La mascota seleccionada no tiene un veterinario principal asignado.");
            return;
        }

        setSaving(true);
        try {
            const { data: { user: clientUser } } = await supabase.auth.getUser();
            const appointmentTime = moment(date).hour(moment(time).hour()).minute(moment(time).minute()).seconds(0).milliseconds(0).toDate();
            const vetId = selectedPet.primary_vet_id;

            // 1. Chequeo de Disponibilidad
            const conflict = await checkAppointmentConflict(vetId, appointmentTime);
            if (conflict) {
                Alert.alert("Horario no disponible", `Ya existe una cita con tu veterinario en este horario (slot de ${APPOINTMENT_DURATION_MINUTES} minutos). Por favor, selecciona otro.`);
                setSaving(false); return;
            }

            // 2. OBTENER IDs Y CHEQUEAR CLÍNICA (CONSULTA DIRECTA Y ESPECÍFICA)
            
            // a. Obtener clinic_id del veterinario específico 
            const { data: vetProfileData, error: vetProfileError } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', vetId)
                .single();

            if (vetProfileError) throw vetProfileError;
            
            // b. Verificación de NULL (Punto de falla que te obliga a revisar la BD)
            if (!vetProfileData || !vetProfileData.clinic_id) {
                // Mensaje detallado para que sepas qué ID buscar en Supabase
                throw new Error(`Clínica del veterinario no definida (ID: ${vetId}). Favor verificar en tabla profiles.`);
            }
            const clinicId = vetProfileData.clinic_id;


            // c. Obtener ID de estado 'Pendiente'
            const { data: statusData } = await supabase.from('appointment_status').select('id').eq('status', 'Pendiente').single();
            if (!statusData) throw new Error("Estado 'Pendiente' no encontrado en BD.");
            const pendingStatusId = statusData.id;

            // 3. Insertar
            const serviceName = SERVICE_CATEGORIES.find(s => s.id === selectedType)?.name || selectedType;
            const reasonWithService = `${serviceName}: ${reason.trim()}`;
            
            const { data: newAppointment, error: insertError } = await supabase.from('appointments').insert({ 
                pet_id: selectedPetId, 
                vet_id: vetId, 
                client_id: clientUser.id, 
                clinic_id: clinicId, 
                status_id: pendingStatusId, 
                appointment_time: appointmentTime.toISOString(), 
                reason: reasonWithService, 
            }).select().single();
            if (insertError) throw insertError;

            // 4. Notificación
            await supabase.from('notifications').insert({ user_id: vetId, type: 'new_appointment', title: `Nueva solicitud para ${selectedPet.name}`, content: `Cita solicitada para el ${moment(appointmentTime).format('LLL')}.`, link_id: newAppointment.id });

            Alert.alert("Éxito", "Tu solicitud de cita ha sido enviada y está pendiente de aprobación.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message || "No se pudo solicitar la cita.");
        } finally { setSaving(false); }
    }, [isFormValid, date, time, reason, selectedPet, selectedPetId, selectedType, checkAppointmentConflict, navigation]);


    // ----------------------
    // ACCIONES DE UI (Pasadas al componente)
    // ----------------------
    const actions = {
        updatePetId: setSelectedPetId,
        updateServiceId: setSelectedType,
        updateReason: setReason,
        
        showPicker: (mode) => {
            setDateTimePickerMode(mode);
            setDateTimePickerVisible(true);
            if (mode === 'date') setIsTimeSet(false);
        },
        handlePickerChange: (event, selectedValue) => {
            if (event.type === 'set' && selectedValue) {
                if (dateTimePickerMode === 'date') {
                    setDate(selectedValue); 
                } else {
                    setTime(selectedValue); 
                }
            } else if (event.type === 'dismissed') {
                 setDateTimePickerVisible(false); 
            }
        },
        transitionToTimePicker: () => setDateTimePickerMode('time'),
        closePickerAndSetTime: () => { setDateTimePickerVisible(false); setIsTimeSet(true); },
        
        handleSubmit: handleSubmit,
    };

    const state = {
        selectedPetId,
        selectedType,
        date,
        time,
        reason,
        loading,
        saving,
        isTimeSet,
        isDateTimePickerVisible,
        dateTimePickerMode,
    };

    const selectors = {
        petOptions,
        serviceOptions,
        isFormValid,
        displayDate: moment(date).format('DD / MM / YYYY'),
        displayTime: moment(time).format('HH:mm A'),
    };

    return { state, actions, selectors };
}