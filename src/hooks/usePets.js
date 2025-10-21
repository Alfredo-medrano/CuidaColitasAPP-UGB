import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase';

export function usePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener las mascotas del usuario autenticado
  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Consulta para obtener las mascotas del usuario autenticado
      const { data, error } = await supabase
        .from('pets')
        .select(`
            id, 
            name, 
            breed, 
            status, 
            birth_date, 
            weight_kg, 
            species:pet_species (name), 
            veterinarian:profiles!primary_vet_id (name)
        `) 
        .eq('owner_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setPets(data || []);
    } catch (error) {
      console.error("Error obteniendo las mascotas:", error.message);
      setPets([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return { pets, loading, refresh: fetchPets };
}