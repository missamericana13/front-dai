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

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas';

interface Usuario {
  nombre: string;
  avatar?: string; 
}

interface TipoReceta {
  nombre?: string;
}

interface Receta {
  idReceta: number;
  nombreReceta: string;
  descripcionReceta?: string;
  fotoPrincipal?: string; 
  usuario: Usuario;
  porciones?: number;
  cantidadPersonas?: number;
  tipoReceta?: TipoReceta;
  fechaCreacion?: string;
  ingredientes?: any[];
}

type OrdenClave = 'antiguedad' | 'usuario';

export default function MyRecipesScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [orden, setOrden] = useState<OrdenClave>('antiguedad');
  const [ascendente, setAscendente] = useState<boolean>(false);

  const fetchRecetas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) throw new Error('No hay usuario logueado');
      const user = JSON.parse(userStr);
      const idUsuario = user.idUsuario || user.id || user.usuario?.idUsuario;
      if (!idUsuario) throw new Error('No se encontró el idUsuario');

      const response = await fetch(`${API_BASE_URL}/usuario/${idUsuario}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Error al obtener recetas');
      let data: Receta[] = await response.json();

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
      Alert.alert('Error', 'No se pudieron cargar tus recetas.');
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecetas();
  }, []);

  const ordenarRecetas = (clave: OrdenClave) => {
    const nuevaDireccion = clave === orden ? !ascendente : true;
    setOrden(clave);
    setAscendente(nuevaDireccion);

    const recetasOrdenadas = [...recetas].sort((a, b) => {
      let resultado = 0;
      switch (clave) {
        case 'antiguedad':
          resultado = (a.idReceta ?? 0) - (b.idReceta ?? 0);
          break;
        case 'usuario':
          resultado = (a.usuario?.nombre ?? '').localeCompare(b.usuario?.nombre ?? '');
          break;
      }
      return nuevaDireccion ? resultado : -resultado;
    });

    setRecetas(recetasOrdenadas);
  };

  const BotonOrden = ({
    label,
    clave,
  }: {
    label: string;
    clave: OrdenClave;
  }) => {
    const activo = orden === clave;
    return (
      <TouchableOpacity
        style={styles.ordenButton}
        onPress={() => ordenarRecetas(clave)}
      >
        <Text style={[styles.ordenText, activo && styles.ordenTextActivo]}>
          {label}
        </Text>
        {activo && (
          <Ionicons
            name={ascendente ? 'arrow-up' : 'arrow-down'}
            size={16}
            color="#2B5399"
          />
        )}
      </TouchableOpacity>
    );
  };

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
      ) : recetas.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No tienes recetas propias aún.</Text>
        </View>
      ) : (
        <>
          <View style={styles.ordenContainer}>
            <BotonOrden label="Antigüedad" clave="antiguedad" />
            <BotonOrden label="Usuario" clave="usuario" />
          </View>
          <FlatList
            data={recetas}
            keyExtractor={(item) => item.idReceta.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchRecetas}
          />
        </>
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
  ordenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  ordenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ordenText: {
    color: '#333',
    fontSize: 14,
  },
  ordenTextActivo: {
    color: '#2B5399',
    fontWeight: 'bold',
  },
});