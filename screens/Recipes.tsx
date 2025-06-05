import { Ionicons } from '@expo/vector-icons';
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

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas/aprobadas'; // ← CAMBIAR por tu URL real

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const totalStars = 5;

  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={16} color="#F5A623" />
      ))}
      {hasHalfStar && (
        <Ionicons name="star-half" size={16} color="#F5A623" />
      )}
      {Array.from({ length: totalStars - fullStars - (hasHalfStar ? 1 : 0) }).map(
        (_, i) => (
          <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#F5A623" />
        )
      )}
    </View>
  );
};

interface Usuario {
  nombre: string;
  avatar: string;
}

interface Receta {
  id: number;
  nombreReceta: string;
  descripcionReceta: string;
  fotoPrincipal: string;
  estrellas: number;
  usuario: Usuario;
  favorita: boolean;
}

type OrdenClave = 'populares' | 'antiguedad' | 'usuario';

export default function RecipesScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [orden, setOrden] = useState<OrdenClave>('populares');
  const [ascendente, setAscendente] = useState<boolean>(false);

  const fetchRecetas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}`);
      if (!response.ok) {
        throw new Error('Error al obtener recetas');
      }
      const data: Receta[] = await response.json();
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

  const ordenarRecetas = (clave: OrdenClave) => {
    const nuevaDireccion = clave === orden ? !ascendente : true;
    setOrden(clave);
    setAscendente(nuevaDireccion);

    const recetasOrdenadas = [...recetas].sort((a, b) => {
      let resultado = 0;
      switch (clave) {
        case 'populares':
          resultado = a.estrellas - b.estrellas;
          break;
        case 'antiguedad':
          resultado = a.id - b.id;
          break;
        case 'usuario':
          resultado = a.usuario.nombre.localeCompare(b.usuario.nombre);
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
        router.push(`/drawer/recipedetail?id=${encodeURIComponent(item.id.toString())}`)
      }
    >
      <View style={styles.card}>
        <Image source={{ uri: item.fotoPrincipal }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.nombreReceta}</Text>
          <Text style={styles.description}>{item.descripcionReceta}</Text>
          <View style={styles.infoRow}>
            <StarRating rating={item.estrellas} />
            <Ionicons
              name={item.favorita ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color="#2B5399"
            />
          </View>
          <View style={styles.userRow}>
            <Image source={{ uri: item.usuario.avatar }} style={styles.avatar} />
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
        <>
          <View style={styles.ordenContainer}>
            <BotonOrden label="Populares" clave="populares" />
            <BotonOrden label="Antigüedad" clave="antiguedad" />
            <BotonOrden label="Usuario" clave="usuario" />
          </View>
          <FlatList
            data={recetas}
            keyExtractor={(item) => item.id.toString()}
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