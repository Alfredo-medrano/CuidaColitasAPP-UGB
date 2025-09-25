import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';

// Función para formatear el tamaño del archivo de bytes a KB/MB
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function TabArchivos({ petId, navigation }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null); // Nuevo: estado para la sesión
  const isFocused = useIsFocused();

  // Nuevo: Obtener la sesión del usuario
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_attachments')
        .select('*')
        .eq('pet_id', petId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setFiles(data);

    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la lista de archivos.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (isFocused) {
      fetchFiles();
    }
  }, [isFocused, fetchFiles]);

  const handleUploadFile = async () => {
    try {
      if (!session) {
        Alert.alert("Error", "Necesitas estar autenticado para subir archivos.");
        return;
      }
      
      const result = await DocumentPicker.getDocumentAsync();
      if (result.canceled === true) {
        return;
      }
      
      setUploading(true);
      const file = result.assets[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // CAMBIO CLAVE: La ruta ahora incluye el UID del usuario
      const filePath = `${session.user.id}/${petId}/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: fileName,
        type: file.mimeType,
      });

      // 1. Subir el archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      // 2. Insertar el registro en la base de datos
      const { error: dbError } = await supabase
        .from('medical_attachments')
        .insert({
          pet_id: petId,
          file_name: file.name,
          storage_path: filePath,
          file_type: file.mimeType,
          file_size_bytes: file.size,
        });

      if (dbError) throw dbError;
      
      Alert.alert("Éxito", "El archivo se ha subido correctamente.");
      fetchFiles();

    } catch (error) {
      Alert.alert("Error", "No se pudo subir el archivo.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleViewFile = async (filePath) => {
    const { data, error } = await supabase.storage.from('attachments').createSignedUrl(filePath, 60);
    if (error) {
      Alert.alert("Error", "No se pudo obtener el enlace para ver el archivo.");
    } else {
      Linking.openURL(data.signedUrl);
    }
  };

  const handleDeleteFile = async (file) => {
    Alert.alert("Confirmar Eliminación", `¿Seguro que quieres eliminar ${file.file_name}?`, [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Eliminar', style: 'destructive', onPress: async () => {
            try {
                // 1. Borrar de Storage
                const { error: storageError } = await supabase.storage.from('attachments').remove([file.storage_path]);
                if (storageError) throw storageError;

                // 2. Borrar de la base de datos
                const { error: dbError } = await supabase.from('medical_attachments').delete().eq('id', file.id);
                if (dbError) throw dbError;

                Alert.alert("Éxito", "El archivo ha sido eliminado.");
                fetchFiles();
            } catch (error) {
                Alert.alert("Error", "No se pudo eliminar el archivo.");
                console.error(error);
            }
        }}
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{marginTop: 50}} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Archivos y Documentos</Text>
        <Pressable style={styles.addButton} onPress={handleUploadFile} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Icon name="upload" size={14} color="#fff" />}
          <Text style={styles.addButtonText}>{uploading ? 'Subiendo...' : 'Subir'}</Text>
        </Pressable>
      </View>
      <FlatList
        data={files}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Icon name={item.file_type?.includes('pdf') ? 'file-pdf' : 'file-image'} size={24} color="#013847" />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.file_name}</Text>
              <Text style={styles.fileMeta}>
                {new Date(item.uploaded_at).toLocaleDateString('es-ES')} • {formatBytes(item.file_size_bytes || 0)}
              </Text>
            </View>
            <View style={styles.fileActions}>
              <Pressable style={styles.fileButton} onPress={() => handleViewFile(item.storage_path)}><Icon name="eye" size={18} color="#007bff" /></Pressable>
              <Pressable style={styles.fileButton} onPress={() => handleDeleteFile(item)}><Icon name="trash-alt" size={18} color="#dc3545" /></Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{paddingHorizontal: 15}}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay archivos adjuntos.</Text>}
      />
    </View>
  );
}

// --- Estilos para este componente de pestaña ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, paddingTop: 20 },
  tabTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15 },
  fileInfo: { flex: 1, marginHorizontal: 15 },
  fileName: { fontSize: 16, fontWeight: '500', color: '#333' },
  fileMeta: { fontSize: 12, color: '#777', marginTop: 2 },
  fileActions: { flexDirection: 'row' },
  fileButton: { marginLeft: 15, padding: 5 },
  emptyText: { color: '#fff', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});