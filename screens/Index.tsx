import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas/ultimas';

interface Usuario {
  nombre: string;
  avatar?: string; // base64
}

interface TipoReceta {
  nombre?: string;
}

interface Receta {
  idReceta: number;
  nombreReceta: string;
  descripcionReceta?: string;
  fotoPrincipal?: string; // base64
  usuario: Usuario;
  porciones?: number;
  cantidadPersonas?: number;
  tipoReceta?: TipoReceta;
  fechaCreacion?: string;
  ingredientes?: any[];
}

export default function HomeScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecetas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Error al obtener recetas');
      let data: Receta[] = await response.json();

      // Convertir imágenes y avatar a base64 URI o usar placeholder online
      data = data.map((receta) => ({
        ...receta,
        fotoPrincipal: receta.fotoPrincipal
          ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
          : 'https://via.placeholder.com/400x160?text=Sin+Imagen',
        usuario: {
          ...receta.usuario,
          avatar: receta.usuario?.avatar
            ? `data:image/jpeg;base64,${receta.usuario.avatar}`
            : 'https://ui-avatars.com/api/?name=User',
        },
      }));

      setRecetas(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las recetas del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecetas();
  }, []);

  const renderItem = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${encodeURIComponent(item.idReceta.toString())}`)
      }
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.fotoPrincipal }}
          style={styles.image}
        />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.nombreReceta}</Text>
          <Text style={styles.description}>
            {item.descripcionReceta || 'Sin descripción'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {item.porciones ? `Porciones: ${item.porciones}` : ''}
            </Text>
            <Text style={styles.infoText}>
              {item.tipoReceta?.nombre ? `Tipo: ${item.tipoReceta.nombre}` : ''}
            </Text>
          </View>
          <View style={styles.userRow}>
            <Image
              source={{ uri: item.usuario.avatar }}
              style={styles.avatar}
            />
            <Text>{item.usuario.nombre}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2B5399" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item.idReceta.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE5D8',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  description: {
    fontSize: 14,
    marginVertical: 6,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
});