// src/hooks/usePets.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase';

// Hook para manejar toda la lógica de las mascotas de un cliente
export function usePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener las mascotas del usuario desde Supabase
  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Gracias a RLS, esta llamada es segura.
      // Solo traerá las mascotas cuyo 'owner_id' coincida con el del usuario.
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id); // Asegúrate que tu columna se llame 'owner_id' o similar

      if (error) throw error;

      setPets(data || []);
    } catch (error) {
      console.error("Error obteniendo las mascotas:", error.message);
      setPets([]); // En caso de error, devuelve una lista vacía
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga las mascotas la primera vez que se usa el hook
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Valores que el hook provee a los componentes
  return { pets, loading, refresh: fetchPets };
}