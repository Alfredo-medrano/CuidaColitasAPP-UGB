// src/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persister para guardar el caché en AsyncStorage (compatible con Expo Go)
export const queryPersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'CUIDACOLITAS_QUERY_CACHE',
    throttleTime: 1000, // Máximo 1 escritura por segundo
});

// Configuración del QueryClient con opciones optimizadas
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Tiempo que los datos se consideran "frescos" (no refetch automático)
            staleTime: 5 * 60 * 1000, // 5 minutos

            // Tiempo que los datos permanecen en caché después de que el componente se desmonta
            gcTime: 30 * 60 * 1000, // 30 minutos

            // Número de reintentos en caso de error
            retry: 2,

            // No refetch al volver a enfocar la ventana (en móvil no es necesario)
            refetchOnWindowFocus: false,

            // Refetch al reconectar a internet
            refetchOnReconnect: 'always',

            // No refetch al montar si los datos están frescos
            refetchOnMount: false,
        },
        mutations: {
            retry: 1,
        },
    },
});
