import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { supabase } from '../../../Supabase';

export default function Mensajes({ navigation }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const getMessages = async () => {
      const { data, error } = await supabase
        .from('messages') 
        .select('*');

      if (error) {
        console.log('Error al obtener mensajes:', error.message);
      } else {
        setMessages(data);
      }
    };
    getMessages();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mensajes</Text>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={styles.messageCard}>
            <Text style={styles.messageSender}>{item.sender}</Text>
            <Text>{item.message}</Text>
            <Text>{item.created_at}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#013847', marginBottom: 20 },
  messageCard: {
    backgroundColor: '#E2EDED',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  messageSender: { fontSize: 18, fontWeight: 'bold', color: '#013847' },
});
