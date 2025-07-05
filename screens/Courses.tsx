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
import { useAuth } from '../context/authContext';

const API_BASE_URL = 'http://192.168.1.31:8080/api/cursos';

// Solo como fallback para cursos sin imagen
const getFallbackImage = (courseId: number): string => {
  return `https://picsum.photos/400/160?random=${courseId}`;
};

interface Curso {
  idCurso: number;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  imagen?: string; // Base64 de la imagen (solo para alumnos)
  precio?: number;
  modalidad?: string;
  duracion?: number;
  imageLoadError?: boolean;
}

export default function CoursesScreen() {
  const { userId, userRole } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // ✅ CORRECTO: Usar endpoint base siempre, pero agregar parámetro solo para alumnos
      let url = API_BASE_URL;
      if (userRole === 'alumno' && userId) {
        url = `${API_BASE_URL}?idUsuario=${userId}`;
      }
      
      console.log('🔗 Fetching cursos desde:', url);
      console.log('👤 UserRole:', userRole, 'UserId:', userId);
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      let data: Curso[] = await response.json();
      console.log('📊 Cursos recibidos:', data.length, data);

      // ✅ CORREGIDO: Simplificar procesamiento de imágenes
      data = data.map((curso) => {
        let finalImageUrl = '';
        
        if (userRole === 'alumno') {
          // Para alumnos: el backend envía CursoDTO con imagen Base64
          if (curso.imagen) {
            // ✅ CORRECTO: Usar imagen Base64 directamente
            finalImageUrl = `data:image/jpeg;base64,${curso.imagen}`;
            console.log(`✅ Imagen Base64 para curso ${curso.idCurso}`);
          } else if (curso.imagenUrl) {
            // ✅ CORRECTO: Usar imagenUrl si existe
            finalImageUrl = `http://192.168.1.31:8080${curso.imagenUrl}`;
            console.log(`🔗 URL del backend para curso ${curso.idCurso}: ${finalImageUrl}`);
          } else {
            // ✅ FALLBACK: Endpoint directo como última opción
            finalImageUrl = `http://192.168.1.31:8080/api/cursos/${curso.idCurso}/imagen`;
            console.log(`🔗 URL endpoint fallback para alumno curso ${curso.idCurso}`);
          }
        } else {
          // Para visitantes: el backend envía CursoResumenDTO
          if (curso.imagenUrl) {
            // ✅ CORRECTO: El backend devuelve "/api/cursos/{id}/imagen"
            finalImageUrl = `http://192.168.1.31:8080${curso.imagenUrl}`;
            console.log(`🔗 URL del backend para visitante curso ${curso.idCurso}: ${finalImageUrl}`);
          } else {
            // ✅ FALLBACK: Endpoint directo
            finalImageUrl = `http://192.168.1.31:8080/api/cursos/${curso.idCurso}/imagen`;
            console.log(`🔗 URL endpoint fallback para visitante curso ${curso.idCurso}`);
          }
        }
        
        return {
          ...curso,
          imagenUrl: finalImageUrl,
          imageLoadError: false,
        };
      });
      
      setCursos(data);
      console.log('✅ Cursos procesados correctamente');
      
    } catch (error) {
      console.error('❌ Error en fetchCursos:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar los cursos del servidor.\n\n' + 
        (error instanceof Error ? error.message : 'Error desconocido')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (cursoId: number) => {
    console.log(`⚠️ Error cargando imagen para curso ${cursoId}, usando fallback`);
    setCursos(prevCursos => 
      prevCursos.map(curso => 
        curso.idCurso === cursoId 
          ? { 
              ...curso, 
              imagenUrl: getFallbackImage(cursoId),
              imageLoadError: true 
            }
          : curso
      )
    );
  };

  useEffect(() => {
    fetchCursos();
  }, [userRole, userId]);

  const renderItem = ({ item }: { item: Curso }) => (
    // ✅ Solo los alumnos pueden tocar para ver detalles
    <TouchableOpacity
      onPress={() => {
        if (userRole === 'alumno') {
          router.push('/drawer/coursesdetail?id=' + item.idCurso);
        }
      }}
      disabled={userRole !== 'alumno'}
      style={[styles.card, userRole !== 'alumno' && styles.cardDisabled]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imagenUrl }}
          style={styles.image}
          onError={() => {
            if (!item.imageLoadError) {
              handleImageError(item.idCurso);
            }
          }}
          onLoadStart={() => console.log(`📸 Cargando imagen: ${item.imagenUrl}`)}
          onLoad={() => console.log(`✅ Imagen cargada para curso ${item.idCurso}`)}
        />
        {/* ✅ Indicador visual sutil para visitantes */}
        {userRole !== 'alumno' && (
          <View style={styles.visitorOverlay}>
            <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.visitorText}>Vista previa</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.description} numberOfLines={userRole === 'alumno' ? 2 : 3}>
          {item.descripcion || 'Sin descripción disponible'}
        </Text>
        
        {/* ✅ Solo alumnos ven información completa */}
        {userRole === 'alumno' && (
          <View style={styles.cursoInfo}>
            {item.precio && (
              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={14} color="#28a745" />
                <Text style={styles.precio}>${item.precio.toLocaleString()}</Text>
              </View>
            )}
            
            {item.modalidad && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={14} color="#2B5399" />
                <Text style={styles.modalidad}>{item.modalidad}</Text>
              </View>
            )}
            
            {item.duracion && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.duracion}>{item.duracion} clases</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B5399" />
          <Text style={styles.loadingText}>Cargando cursos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header diferenciado según tipo de usuario */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === 'alumno' ? 'Cursos disponibles' : 'Catálogo de cursos'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {userRole === 'alumno' 
            ? 'Toca en un curso para ver detalles e inscribirte' 
            : 'Vista previa de nuestra oferta educativa'
          }
        </Text>
      </View>

      {cursos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay cursos disponibles</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCursos}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cursos}
          keyExtractor={(item) => item.idCurso.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchCursos}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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
  card: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardDisabled: {
    opacity: 0.9,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  // ✅ NUEVO: Overlay sutil para visitantes
  visitorOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginLeft: 4,
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
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  cursoInfo: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginLeft: 6,
  },
  modalidad: {
    fontSize: 14,
    color: '#2B5399',
    marginLeft: 6,
    fontWeight: '500',
  },
  duracion: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
});