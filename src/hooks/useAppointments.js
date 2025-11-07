// src/hooks/useAppointments.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../api/Supabase';
import moment from 'moment';

/**
 * Hook para manejar la lógica de las citas de un cliente o veterinario.
 * Proporciona: data, isLoading, error y refetch(month).
 * @param {boolean} isVet Si es true, filtra por vet_id. Si es false, por client_id.
 * @param {moment.Moment} initialMonth Mes base para la búsqueda.
 */
export function useAppointments(isVet = false, initialMonth = moment()) {
  const [data, setData] = useState([]);          // Siempre array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const filterColumn = isVet ? 'vet_id' : 'client_id';

  const fetchAppointments = useCallback(
    async (month) => {
      if (isLoading) return; // Evitar dobles fetch simultáneos

      setIsLoading(true);
      setError(null);

      const targetMonth = month || initialMonth;

      try {
        // 1) Usuario autenticado
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;
        if (!user) {
          throw new Error('Usuario no autenticado. Por favor, inicie sesión.');
        }

        // 2) Rango de fechas del mes
        const startDate = moment(targetMonth).startOf('month').toISOString();
        const endDate = moment(targetMonth).endOf('month').toISOString();

        // 3) Query
        const { data: appointmentsData, error: supabaseError } = await supabase
          .from('appointments')
          .select(
            `
            id,
            appointment_time,
            reason,
            pet:pets(name),
            vet:profiles!vet_id(name),
            status:appointment_status(status)
          `
          )
          .eq(filterColumn, user.id)
          .gte('appointment_time', startDate)
          .lte('appointment_time', endDate)
          .order('appointment_time', { ascending: true });

        if (supabaseError) throw supabaseError;

        setData(Array.isArray(appointmentsData) ? appointmentsData : []);
      } catch (err) {
        console.error('Error al cargar citas:', err?.message ?? err);
        setError(err?.message || 'Error desconocido del servidor');
        setData([]); // Asegurar array
      } finally {
        setIsLoading(false);
      }
    },
    [filterColumn, initialMonth, isLoading]
  );

  // Fetch inicial y cuando cambie el mes inicial
  useEffect(() => {
    fetchAppointments(initialMonth);
  }, [fetchAppointments, initialMonth]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAppointments,
  };
}
