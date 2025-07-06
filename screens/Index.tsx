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
  ScrollView,
} from 'react-native';

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas/ultimas';

interface Usuario {
  nombre: string;
  alias?: string;
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

export default function HomeScreen() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecetas = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Cargando últimas recetas desde:', API_BASE_URL);
      
      const response = await fetch(API_BASE_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) throw new Error('Error al obtener recetas');
      let data: Receta[] = await response.json();

      console.log('✅ Últimas recetas cargadas:', data.length);

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
        'No se pudieron cargar las últimas recetas.\n\n' + 
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

  const renderFeaturedItem = (item: Receta) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() =>
        router.push(`/drawer/recipedetail?id=${item.idReceta}`)
      }
      activeOpacity={0.8}
    >
      <View style={styles.featuredImageContainer}>
        <Image
          source={{ uri: item.fotoPrincipal }}
          style={styles.featuredImage}
          onError={() => console.log('Error cargando imagen destacada')}
        />
        <View style={styles.featuredOverlay}>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.featuredBadgeText}>Destacada</Text>
          </View>
          {item.tipoReceta?.nombre && (
            <View style={styles.tipoBadge}>
              <Text style={styles.tipoText}>{item.tipoReceta.nombre}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.nombreReceta}
        </Text>
        
        {item.descripcionReceta && (
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {item.descripcionReceta}
          </Text>
        )}

        {/* ✅ Información de la receta destacada */}
        <View style={styles.featuredMetaInfo}>
          {item.cantidadPersonas && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{item.cantidadPersonas} personas</Text>
            </View>
          )}
          
          {formatearTiempo(item.tiempoPreparacion) && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formatearTiempo(item.tiempoPreparacion)}</Text>
            </View>
          )}
        </View>

        {/* ✅ Autor destacado */}
        <View style={styles.featuredAutorContainer}>
          <Image
            source={{ uri: item.usuario.avatar }}
            style={styles.featuredAvatar}
          />
          <View style={styles.autorInfo}>
            <Text style={styles.featuredAutorNombre} numberOfLines={1}>
              {item.usuario.alias || item.usuario.nombre}
            </Text>
            <Text style={styles.autorLabel}>Chef destacado</Text>
          </View>
          <View style={styles.verMasContainer}>
            <Ionicons name="chevron-forward" size={20} color="#2B5399" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );


  const renderItem = ({ item, index }: { item: Receta; index: number }) => {
    if (index === 0) return null;
    
    return (
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
          {item.tipoReceta?.nombre && (
            <View style={styles.tipoBadgeSmall}>
              <Text style={styles.tipoTextSmall}>{item.tipoReceta.nombre}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.nombreReceta}</Text>
          
          {item.descripcionReceta && (
            <Text style={styles.description} numberOfLines={1}>
              {item.descripcionReceta}
            </Text>
          )}

          <View style={styles.metaInfo}>
            {item.cantidadPersonas && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.metaTextSmall}>{item.cantidadPersonas}p</Text>
              </View>
            )}
            
            {formatearTiempo(item.tiempoPreparacion) && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaTextSmall}>{formatearTiempo(item.tiempoPreparacion)}</Text>
              </View>
            )}
          </View>

          <View style={styles.autorContainer}>
            <Image
              source={{ uri: item.usuario.avatar }}
              style={styles.avatar}
            />
            <Text style={styles.autorNombre} numberOfLines={1}>
              {item.usuario.alias || item.usuario.nombre}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B5399" />
          <Text style={styles.loadingText}>Cargando últimas recetas...</Text>
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
            Parece que no hay recetas publicadas recientemente
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
      {/* ✅ Header de bienvenida */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>¡Bienvenido!</Text>
            <Text style={styles.headerTitle}>Últimas Recetas</Text>
          </View>
          <TouchableOpacity 
            style={styles.verTodasButton}
            onPress={() => router.push('/drawer/(tabs)/recipes')}
          >
            <Text style={styles.verTodasText}>Ver todas</Text>
            <Ionicons name="chevron-forward" size={16} color="#2B5399" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recetas}
        keyExtractor={(item) => item.idReceta.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2B5399']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          recetas.length > 0 ? renderFeaturedItem(recetas[0]) : null
        }
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  verTodasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  verTodasText: {
    color: '#2B5399',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
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
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 24,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tipoBadge: {
    backgroundColor: 'rgba(43, 83, 153, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredContent: {
    padding: 20,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  featuredMetaInfo: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  featuredAutorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  featuredAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  featuredAutorNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
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
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    width: 120,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  tipoBadgeSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(43, 83, 153, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tipoTextSmall: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  metaTextSmall: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  autorNombre: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B5399',
    flex: 1,
  },
  autorInfo: {
    flex: 1,
  },
  autorLabel: {
    fontSize: 11,
    color: '#666',
  },
  verMasContainer: {
    padding: 4,
  },
});