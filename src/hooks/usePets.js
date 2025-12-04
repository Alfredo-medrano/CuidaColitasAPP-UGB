import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase';

/**
 * Hook para obtener la lista de mascotas del usuario autenticado.
 * Devuelve un objeto estandarizado con el estado del dato (data), carga (isLoading),
 * errores (error) y una función para recargar los datos (refetch).
 * 
 * ✅ OPTIMIZADO: Limita appointments a los últimos 6 meses para reducir data transfer.
 */
export function usePets() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función de fetching centralizada, envuelta en useCallback para estabilidad
  const fetchPets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener el usuario autenticado para filtrar por client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado. Inicie sesión.");
      }

      const userId = user.id;

      // ✅ OPTIMIZACIÓN: Calcular fecha límite (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const dateLimit = sixMonthsAgo.toISOString();

      // 2. Consulta principal: mascotas con sus datos básicos
      const { data: petsData, error: supabaseError } = await supabase
        .from('pets')
        .select(`
            id, 
            name, 
            breed, 
            birth_date,
            owner_id, 
            weight_kg,
            status,            
            species:species_id(name), 
            veterinarian:primary_vet_id(name)
        `)
        .eq('owner_id', userId)
        .order('name', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      // 3. Si hay mascotas, obtener sus citas recientes (últimos 6 meses)
      if (petsData && petsData.length > 0) {
        const petIds = petsData.map(p => p.id);

        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select(`
              id,
              pet_id,
              appointment_time,
              status:appointment_status(status)
          `)
          .in('pet_id', petIds)
          .gte('appointment_time', dateLimit)
          .order('appointment_time', { ascending: true });

        // 4. Combinar mascotas con sus citas
        const petsWithAppointments = petsData.map(pet => ({
          ...pet,
          appointments: (appointmentsData || []).filter(apt => apt.pet_id === pet.id)
        }));

        setData(petsWithAppointments);
      } else {
        setData(petsData || []);
      }

    } catch (err) {
      console.error("Error al cargar mascotas:", err.message);
      setError(err.message || 'Error desconocido al cargar las mascotas.');
      setData([]);

    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect para ejecutar el fetch inicial
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // EL CONTRATO DE SALIDA ESTANDARIZADO
  return {
    data, // Lista de mascotas
    isLoading, // true/false
    error, // null o string/objeto de error
    refetch: fetchPets // Función para recargar
  };
}