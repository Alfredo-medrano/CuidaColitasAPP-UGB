// src/hooks/useAppointmentForm.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/Supabase';
import moment from 'moment';
import 'moment/locale/es';
import { scheduleAppointmentReminders } from '../services/notificationService';

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
    const [vets, setVets] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedVetId, setSelectedVetId] = useState(null);
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

    const vetOptions = useMemo(() => {
        if (selectedPet?.primary_vet_id) return [];
        return (vets || []).map(v => ({
            label: `Dr. ${v.name} (${v.is_active === false ? 'Inactivo' : 'Activo'})`,
            value: v.id,
            isActive: v.is_active !== false
        }));
    }, [vets, selectedPet]);

    const serviceOptions = useMemo(() => {
        return (SERVICE_CATEGORIES || []).map(s => ({ label: s.name, value: s.id }));
    }, []);

    const isFormValid = useMemo(() => {
        const hasVet = selectedPet?.primary_vet_id || selectedVetId;
        return selectedPetId && selectedType && reason.trim() && isTimeSet && hasVet;
    }, [selectedPetId, selectedType, reason, isTimeSet, selectedPet, selectedVetId]);

    // ----------------------
    // LÓGICA DE FETCH
    // ----------------------
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            const { data: petData, error: petError } = await supabase.from('pets').select('id, name, primary_vet_id').eq('owner_id', user.id);
            if (petError) throw petError;
            setPets(petData || []);

            const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'veterinario').single();
            if (roleData) {
                const { data: vetData } = await supabase
                    .from('profiles')
                    .select('id, name, is_active')
                    .eq('role_id', roleData.id)
                    .order('name');
                setVets(vetData || []);
            }
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
    // LÓGICA DE DISPONIBILIDAD
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

    // ----------------------
    // SUBMIT CON RECORDATORIOS
    // ----------------------
    const handleSubmit = useCallback(async () => {
        if (!isFormValid) {
            Alert.alert("Campos incompletos", "Por favor, completa todos los campos del formulario.");
            return;
        }

        const vetId = selectedPet?.primary_vet_id || selectedVetId;
        if (!vetId) {
            Alert.alert("Error", "Debes seleccionar un veterinario para esta mascota.");
            return;
        }

        setSaving(true);
        try {
            const { data: { user: clientUser } } = await supabase.auth.getUser();
            const appointmentTime = moment(date).hour(moment(time).hour()).minute(moment(time).minute()).seconds(0).milliseconds(0).toDate();

            // 1. Chequeo de Disponibilidad
            const conflict = await checkAppointmentConflict(vetId, appointmentTime);
            if (conflict) {
                Alert.alert("Horario no disponible", `Ya existe una cita con este veterinario en este horario. Por favor, selecciona otro.`);
                setSaving(false);
                return;
            }

            // 2. Obtener clínica del veterinario
            const { data: vetProfileData, error: vetProfileError } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', vetId)
                .single();

            if (vetProfileError) throw vetProfileError;
            if (!vetProfileData || !vetProfileData.clinic_id) {
                throw new Error(`El veterinario seleccionado no tiene una clínica asignada.`);
            }
            const clinicId = vetProfileData.clinic_id;

            // 3. Obtener ID de estado 'Pendiente'
            const { data: statusData } = await supabase.from('appointment_status').select('id').eq('status', 'Pendiente').single();
            if (!statusData) throw new Error("Estado 'Pendiente' no encontrado en BD.");
            const pendingStatusId = statusData.id;

            // 4. Insertar Cita
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

            // 5. Si la mascota no tenía vet, asignarlo
            if (!selectedPet.primary_vet_id) {
                await supabase.from('pets').update({ primary_vet_id: vetId }).eq('id', selectedPetId);
            }

            // 6. Notificación in-app al veterinario
            await supabase.from('notifications').insert({
                user_id: vetId,
                type: 'new_appointment',
                title: `Nueva solicitud para ${selectedPet.name}`,
                content: `Cita solicitada para el ${moment(appointmentTime).format('LLL')}.`,
                link_id: newAppointment.id
            });

            // 7. 🔔 PROGRAMAR RECORDATORIOS PUSH (24h y 1h antes)
            try {
                await scheduleAppointmentReminders(
                    appointmentTime,
                    selectedPet.name,
                    newAppointment.id
                );
                console.log('Recordatorios de cita programados exitosamente');
            } catch (reminderError) {
                console.warn('No se pudieron programar recordatorios:', reminderError);
                // No bloqueamos el flujo si falla el recordatorio
            }

            Alert.alert("Éxito", "Tu solicitud de cita ha sido enviada y está pendiente de aprobación.");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message || "No se pudo solicitar la cita.");
        } finally {
            setSaving(false);
        }
    }, [isFormValid, date, time, reason, selectedPet, selectedPetId, selectedType, selectedVetId, checkAppointmentConflict, navigation]);

    // ----------------------
    // ACCIONES DE UI
    // ----------------------
    const actions = {
        updatePetId: (id) => { setSelectedPetId(id); setSelectedVetId(null); },
        updateVetId: setSelectedVetId,
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
        selectedVetId,
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
        vetOptions,
        serviceOptions,
        isFormValid,
        displayDate: moment(date).format('DD / MM / YYYY'),
        displayTime: moment(time).format('HH:mm A'),
        needsVetSelection: selectedPetId && !selectedPet?.primary_vet_id
    };

    return { state, actions, selectors };
}