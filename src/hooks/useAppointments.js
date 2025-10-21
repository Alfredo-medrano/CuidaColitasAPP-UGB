import { useState, useCallback } from 'react';
import { supabase } from '../api/Supabase';
import moment from 'moment'; 

/**
 * Hook para manejar la lógica de las citas de un cliente.
 * Se encarga de la autenticación, la consulta de la API y el manejo del estado.
 */
export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false); 

  /**
   * Obtiene las citas del usuario para el mes proporcionado.
   * @param {Date | string} month 
   */
  const fetchAppointmentsByMonth = useCallback(async (month) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const startDate = moment(month).startOf('month').toISOString();
      const endDate = moment(month).endOf('month').toISOString();
      const { data, error } = await supabase
        .from('appointments')
        .select(`
            id, 
            appointment_time, 
            reason, 
            pet:pets(name), 
            vet:profiles!vet_id(name), 
            status:appointment_status(status)
        `)
        .eq('client_id', user.id)
        .gte('appointment_time', startDate)
        .lte('appointment_time', endDate)
        .order('appointment_time', { ascending: true }); 
      
      if (error) throw error;
      
      setAppointments(data || []);

    } catch (error) {
      console.error("Error al cargar citas:", error.message);
      setAppointments([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporta los datos, recarga y estado de carga
  return { 
    appointments, 
    loading, 
    refresh: fetchAppointmentsByMonth 
  };
}