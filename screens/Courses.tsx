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
  imagen?: string; // Base64 de la imagen
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
      const url = userRole === 'alumno'
        ? `${API_BASE_URL}?idUsuario=${userId}`
        : API_BASE_URL;
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Error al obtener cursos');
      let data: Curso[] = await response.json();

      // Procesar las imágenes
      data = data.map((curso) => {
        let finalImageUrl = '';
        
        // Prioridad 1: Si tiene imagen en Base64 del backend
        if (curso.imagen) {
          // Usar directamente la imagen Base64
          finalImageUrl = `data:image/jpeg;base64,${curso.imagen}`;
        }
        // Prioridad 2: Si tiene imagenUrl del backend
        else if (curso.imagenUrl) {
          finalImageUrl = curso.imagenUrl.startsWith('http') 
            ? curso.imagenUrl 
            : `http://192.168.1.31:8080${curso.imagenUrl}`;
        }
        // Prioridad 3: Imagen placeholder como último recurso
        else {
          finalImageUrl = getFallbackImage(curso.idCurso);
        }
        
        return {
          ...curso,
          imagenUrl: finalImageUrl,
          imageLoadError: false,
        };
      });
      
      setCursos(data);
    } catch (error) {
      console.error('❌ Error en fetchCursos:', error);
      Alert.alert('Error', 'No se pudieron cargar los cursos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (cursoId: number) => {
    // Si falla la imagen, usar placeholder
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
    <TouchableOpacity
      onPress={() =>
        router.push('/drawer/coursesdetail?id=' + item.idCurso)
      }
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.imagenUrl }}
          style={styles.image}
          onError={() => {
            if (!item.imageLoadError) {
              console.log(`❌ Error cargando imagen para curso ${item.idCurso}`);
              handleImageError(item.idCurso);
            }
          }}
        />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.nombre}</Text>
          <Text style={styles.description}>
            {item.descripcion || 'Sin descripción'}
          </Text>
          
          {/* Información adicional para alumnos */}
          {userRole === 'alumno' && (
            <View style={styles.cursoInfo}>
              {item.precio && (
                <Text style={styles.precio}>${item.precio}</Text>
              )}
              {item.modalidad && (
                <Text style={styles.modalidad}>{item.modalidad}</Text>
              )}
              {item.duracion && (
                <Text style={styles.duracion}>{item.duracion} clases</Text>
              )}
            </View>
          )}
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
          data={cursos}
          keyExtractor={(item) => item.idCurso.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchCursos}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  cursoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  precio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  modalidad: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  duracion: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});