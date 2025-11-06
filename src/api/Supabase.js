import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Obtener las credenciales de Supabase desde las variables de entorno
const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey;

// Verificar que las credenciales estén presentes
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Las credenciales de Supabase no están cargadas.");
  console.error("Asegúrate de que 'app.config.js' y '.env.local' estén configurados correctamente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});