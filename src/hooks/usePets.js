import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase'; 

/**
 * Hook para obtener la lista de mascotas del usuario autenticado.
 * Devuelve un objeto estandarizado con el estado del dato (data), carga (isLoading),
 * errores (error) y una función para recargar los datos (refetch).
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

      // 2. Consulta de Supabase para obtener las mascotas del cliente
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
        // Filtra por el ID del usuario actual
        .eq('owner_id', userId) 
        .order('name', { ascending: true }); 

      if (supabaseError) {
        throw supabaseError;
      }
      
      setData(petsData || []);

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