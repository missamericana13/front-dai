import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import NetInfo from '@react-native-community/netinfo';

type Receta = {
  id: number;
  nombre: string;
  usuario: { alias: string };
  imagenUrl: string;
};

export default function HomeScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isConnected) {
      setLoading(true);
      fetch('http://localhost:8080/api/recetas/ultimas')
        .then(res => res.json())
        .then(data => setRecetas(data))
        .catch(() => Alert.alert('Error', 'No se pudieron cargar las recetas'))
        .finally(() => setLoading(false));
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No hay conexión a internet. No se puede usar la aplicación.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imagenUrl }} style={styles.image} />
              <ThemedText style={styles.recipeName}>{item.nombre}</ThemedText>
              <ThemedText style={styles.recipeUser}>Por: {item.usuario.alias}</ThemedText>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#EDE5D8', 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  image: {
    width: 220,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recipeUser: {
    fontSize: 14,
    color: '#888',
  },
});