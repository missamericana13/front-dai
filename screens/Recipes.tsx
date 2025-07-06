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
  RefreshControl,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas/aprobadas';

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
  tiempoPreparacion?: number;
  dificultad?: string;
}

type OrdenClave = 'antiguedad' | 'usuario';

export default function RecipesScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orden, setOrden] = useState<OrdenClave>('antiguedad');
  const [ascendente, setAscendente] = useState<boolean>(false);

  const fetchRecetas = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Cargando recetas desde:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) throw new Error('Error al obtener recetas');
      let data: Receta[] = await response.json();

      console.log('✅ Recetas cargadas:', data.length);

      data = data.map((receta) => ({
        ...receta,
        fotoPrincipal: receta.fotoPrincipal
          ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
          : `https://picsum.photos/400/300?random=${receta.idReceta}`,
        usuario: {
          ...receta.usuario,
          avatar: receta.usuario?.avatar
            ? `data:image/jpeg;base64,${receta.usuario.avatar}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(receta.usuario?.nombre || 'User')}`,
        },
      }));

      setRecetas(data);
    } catch (error) {
      console.error('❌ Error cargando recetas:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar las recetas del servidor.\n\n' + 
        (error instanceof Error ? error.message : 'Error desconocido')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecetas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecetas(false);
  };

  const formatearTiempo = (minutos?: number) => {
    if (!minutos) return null;
    
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  };

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
    icon,
  }: {
    label: string;
    clave: OrdenClave;
    icon: string;
  }) => {
    const activo = orden === clave;
    return (
      <TouchableOpacity
        style={[styles.ordenButton, activo && styles.ordenButtonActivo]}
        onPress={() => ordenarRecetas(clave)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={icon as any} 
          size={16} 
          color={activo ? '#2B5399' : '#666'} 
        />
        <Text style={[styles.ordenText, activo && styles.ordenTextActivo]}>
          {label}
        </Text>
        {activo && (
          <Ionicons
            name={ascendente ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#2B5399"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Receta }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${item.idReceta}`)
      }
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.fotoPrincipal }}
          style={styles.image}
          onError={() => console.log('Error cargando imagen de receta')}
        />
        {/* ✅ Badge de tipo de receta */}
        {item.tipoReceta?.nombre && (
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoText}>{item.tipoReceta.nombre}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.nombreReceta}</Text>
        
        {item.descripcionReceta && (
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcionReceta}
          </Text>
        )}

        {/* ✅ Información de la receta con iconos */}
        <View style={styles.metaInfo}>
          {item.cantidadPersonas && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.cantidadPersonas} personas</Text>
            </View>
          )}
          
          {formatearTiempo(item.tiempoPreparacion) && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{formatearTiempo(item.tiempoPreparacion)}</Text>
            </View>
          )}
          
          {item.dificultad && (
            <View style={styles.metaItem}>
              <Ionicons name="bar-chart-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{item.dificultad}</Text>
            </View>
          )}
        </View>

        {/* ✅ Información del autor mejorada */}
        <View style={styles.autorContainer}>
          <Image
            source={{ uri: item.usuario.avatar }}
            style={styles.avatar}
          />
          <View style={styles.autorInfo}>
            <Text style={styles.autorNombre} numberOfLines={1}>
              {item.usuario.nombre}
            </Text>
            <Text style={styles.autorLabel}>Chef</Text>
          </View>
          <View style={styles.verMasContainer}>
            <Ionicons name="chevron-forward" size={16} color="#2B5399" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B5399" />
          <Text style={styles.loadingText}>Cargando recetas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (recetas.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay recetas disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Parece que no hay recetas publicadas en este momento
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRecetas()}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header con título */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recetas</Text>
        <Text style={styles.headerSubtitle}>
          {recetas.length} receta{recetas.length !== 1 ? 's' : ''} disponible{recetas.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* ✅ Controles de ordenamiento mejorados */}
      <View style={styles.ordenContainer}>
        <Text style={styles.ordenLabel}>Ordenar por:</Text>
        <View style={styles.ordenButtons}>
          <BotonOrden label="Fecha" clave="antiguedad" icon="calendar-outline" />
          <BotonOrden label="Autor" clave="usuario" icon="person-outline" />
        </View>
      </View>

      {/* ✅ Lista de recetas */}
      <FlatList
        data={recetas}
        keyExtractor={(item) => item.idReceta.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2B5399']}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ordenContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  ordenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  ordenButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ordenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  ordenButtonActivo: {
    backgroundColor: '#e8f2ff',
    borderColor: '#2B5399',
  },
  ordenText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  ordenTextActivo: {
    color: '#2B5399',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  tipoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(43, 83, 153, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  autorInfo: {
    flex: 1,
  },
  autorNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  autorLabel: {
    fontSize: 12,
    color: '#666',
  },
  verMasContainer: {
    padding: 4,
  },
});