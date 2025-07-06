import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

interface RecetaGuardada {
  idRecetaGuardada: number;
  receta: {
    idReceta: number;
    nombreReceta: string;
    descripcionReceta?: string;
    fotoPrincipal?: string;
    tiempoPreparacion?: number;
    dificultad?: string;
    usuario?: {
      nombre: string;
      alias?: string;
    };
  };
  usuario: {
    idUsuario: number;
    nombre: string;
  };
  fechaGuardado?: string;
}

export default function FavoriteRecipesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recetasFavoritas, setRecetasFavoritas] = useState<RecetaGuardada[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const obtenerFavoritos = async (showLoading = true) => {
    if (!user?.id) {
      console.log('❌ No hay usuario logueado');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Cargando favoritos para usuario:', user.id);
      
      const response = await fetch(
        `http://192.168.1.31:8080/api/recetas/guardadas?idUsuario=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const favoritos: RecetaGuardada[] = await response.json();
      console.log('✅ Favoritos cargados:', favoritos.length);
      console.log('📋 Estructura completa de favoritos:', JSON.stringify(favoritos, null, 2));
      
      setRecetasFavoritas(favoritos);
    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar tus recetas favoritas.\n\n' + 
        (error instanceof Error ? error.message : 'Error desconocido')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Pantalla de favoritos recibió foco - recargando...');
      obtenerFavoritos();
    }, [user?.id])
  );

  const eliminarFavorito = async (item: RecetaGuardada) => {
    if (!user?.id) return;

    const idReceta = item.receta.idReceta;
    const nombreReceta = item.receta.nombreReceta;

    Alert.alert(
      'Eliminar favorito',
      `¿Estás seguro que quieres eliminar "${nombreReceta}" de tus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(
                `http://192.168.1.31:8080/api/recetas/guardadas/${idReceta}?idUsuario=${user.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );

              if (!response.ok) {
                throw new Error('No se pudo eliminar de favoritos');
              }

              setRecetasFavoritas(prev => 
                prev.filter(fav => fav.receta.idReceta !== idReceta)
              );

              Alert.alert('Éxito', 'Receta eliminada de favoritos');
            } catch (error) {
              console.error('❌ Error eliminando favorito:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta de favoritos');
            }
          }
        }
      ]
    );
  };

  const formatearTiempo = (minutos?: number) => {
    if (!minutos) return 'Sin especificar';
    
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    obtenerFavoritos(false);
  };

  const irADetalle = (item: RecetaGuardada) => {
    const idReceta = item.receta.idReceta;
    console.log('🔗 Navegando a receta:', idReceta);
    router.push(`/drawer/recipedetail?id=${idReceta}`);
  };

  const renderReceta = ({ item, index }: { item: RecetaGuardada; index: number }) => {
    const { receta } = item;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => irADetalle(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: receta.fotoPrincipal 
                ? `data:image/jpeg;base64,${receta.fotoPrincipal}`
                : `https://picsum.photos/400/300?random=${receta.idReceta}` 
            }} 
            style={styles.imagen}
            onError={() => console.log('Error cargando imagen de receta favorita')}
          />
          <View style={styles.favoriteIndicator}>
            <Ionicons name="heart" size={16} color="#ff6b6b" />
          </View>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.titulo} numberOfLines={2}>
            {receta.nombreReceta}
          </Text>
          
          {receta.descripcionReceta && (
            <Text style={styles.descripcion} numberOfLines={2}>
              {receta.descripcionReceta}
            </Text>
          )}
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.metaText}>
                {formatearTiempo(receta.tiempoPreparacion)}
              </Text>
            </View>
            
            {receta.dificultad && (
              <View style={styles.metaItem}>
                <Ionicons name="bar-chart-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{receta.dificultad}</Text>
              </View>
            )}
          </View>

          <Text style={styles.autorText}>
            Por: {receta.usuario?.alias || receta.usuario?.nombre || 'Usuario desconocido'}
          </Text>
        </View>

        {/* ✅ Botón eliminar favorito */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => eliminarFavorito(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="heart" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2B5399" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  if (recetasFavoritas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
        <Text style={styles.emptySubtitle}>
          Explora recetas y agrega las que más te gusten a favoritos
        </Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => router.push('/drawer/(tabs)/recipes')}
        >
          <Ionicons name="search-outline" size={20} color="white" />
          <Text style={styles.exploreButtonText}>Explorar recetas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.encabezado}>Mis Recetas Favoritas</Text>
        <Text style={styles.contador}>
          {recetasFavoritas.length} receta{recetasFavoritas.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={recetasFavoritas}
        renderItem={renderReceta}
        keyExtractor={(item) => `fav-${item.idRecetaGuardada}-${item.receta.idReceta}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2B5399']}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  encabezado: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  contador: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  exploreButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
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
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
  },
  imagen: { 
    width: '100%', 
    height: 180,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  info: { 
    padding: 16 
  },
  titulo: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2B5399',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  autorText: {
    fontSize: 12,
    color: '#2B5399',
    fontWeight: '500',
  },
});