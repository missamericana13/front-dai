import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/authContext';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [receta, setReceta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [pasos, setPasos] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [estrellasNueva, setEstrellasNueva] = useState(5);
  
  // ✅ NUEVO: Estados para favoritos
  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFavorito, setLoadingFavorito] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1. Receta
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (!res.ok) throw new Error('No se pudo cargar la receta');
        const data = await res.json();
        setReceta({
          ...data,
          fotoPrincipal: data.fotoPrincipal
            ? `data:image/jpeg;base64,${data.fotoPrincipal}`
            : `https://picsum.photos/400/300?random=${id}`
        });
        setCantidadPersonas(data.cantidadPersonas || data.porciones || 1);

        // 2. Pasos
        const pasosRes = await fetch(`http://192.168.1.31:8080/api/pasos`);
        if (pasosRes.ok) {
          const allPasos = await pasosRes.json();
          const pasosReceta = allPasos
            .filter((p: any) => p.receta && p.receta.idReceta == id)
            .sort((a: any, b: any) => a.nroPaso - b.nroPaso);
          setPasos(pasosReceta);
        } else {
          setPasos([]);
        }

        // 3. Calificaciones (comentarios)
        await fetchCalificaciones();

        // 4. ✅ NUEVO: Verificar si está en favoritos
        await checkIfFavorito();
      } catch (e) {
        Alert.alert('Error', 'No se pudo cargar la receta');
      } finally {
        setLoading(false);
      }
    };

    const fetchCalificaciones = async () => {
      const califRes = await fetch(`http://192.168.1.31:8080/api/calificaciones/receta/${id}`);
      if (califRes.ok) {
        const califs = await califRes.json();
        setCalificaciones(califs);
      } else {
        setCalificaciones([]);
      }
    };

    fetchAll();
  }, [id]);

  // ✅ NUEVO: Verificar si la receta está en favoritos
  const checkIfFavorito = async () => {
  if (!user?.id) return;
  
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(
      `http://192.168.1.31:8080/api/recetas/guardadas?idUsuario=${user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const favoritos = await response.json();
      console.log('🔍 Favoritos recibidos:', favoritos);
      
      // ✅ CORREGIDO: Verificar diferentes posibles estructuras de datos
      const esFavorito = favoritos.some((fav: any) => {
        // Verificar diferentes posibles campos donde puede estar el id
        const favId = fav.idReceta || fav.receta?.idReceta || fav.id;
        console.log('🔍 Comparando:', favId, 'con', id);
        return favId?.toString() === id?.toString();
      });
      
      console.log('✅ Es favorito:', esFavorito);
      setIsFavorito(esFavorito);
    }
  } catch (error) {
    console.error('Error verificando favoritos:', error);
  }
};

  // ✅ NUEVO: Guardar/Eliminar de favoritos
  const toggleFavorito = async () => {
    if (!user?.id) {
      Alert.alert('Iniciar sesión', 'Debes iniciar sesión para guardar favoritos');
      return;
    }

    setLoadingFavorito(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (isFavorito) {
        // Eliminar de favoritos
        const response = await fetch(
          `http://192.168.1.31:8080/api/recetas/guardadas/${id}?idUsuario=${user.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          setIsFavorito(false);
          Alert.alert('Eliminado', 'Receta eliminada de favoritos');
        } else {
          throw new Error('No se pudo eliminar de favoritos');
        }
      } else {
        // Agregar a favoritos
        const response = await fetch(
          `http://192.168.1.31:8080/api/recetas/guardadas/${id}?idUsuario=${user.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          setIsFavorito(true);
          Alert.alert('Guardado', 'Receta guardada en favoritos');
        } else {
          throw new Error('No se pudo guardar en favoritos');
        }
      }
    } catch (error) {
      console.error('Error al guardar/eliminar favorito:', error);
      Alert.alert('Error', 'No se pudo procesar la solicitud');
    } finally {
      setLoadingFavorito(false);
    }
  };

  // Calcular promedio de estrellas real
  const promedioEstrellas =
    calificaciones.length === 0
      ? 0
      : calificaciones.reduce((total, c) => total + (c.calificacion || 0), 0) / calificaciones.length;

  const renderEstrellas = (cantidad: number) => {
    return (
      <View style={styles.estrellasContainer}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons 
            key={n} 
            name={n <= Math.round(cantidad) ? "star" : "star-outline"} 
            size={16} 
            color="#FFD700" 
            style={styles.estrella}
          />
        ))}
      </View>
    );
  };

  const renderIngrediente = ({ item }: { item: any }) => {
    const unidad = item.unidad?.descripcion || item.unidad || '';
    const proporcion = cantidadPersonas / (receta.cantidadPersonas || receta.porciones || 1);
    const cantidadAjustada = unidad.toLowerCase().includes('necesaria')
      ? unidad
      : `${(item.cantidad * proporcion).toFixed(1)} ${unidad}`;

    return (
      <View style={styles.ingredienteItem}>
        <Ionicons name="checkmark-circle-outline" size={16} color="#28a745" />
        <Text style={styles.ingredienteText}>
          {unidad.toLowerCase().includes('necesaria')
            ? `${unidad} de ${item.nombre}`
            : `${cantidadAjustada} de ${item.nombre}`}
        </Text>
      </View>
    );
  };

  // Render de estrellas para seleccionar
  const renderEstrellasInput = () => (
    <View style={styles.estrellasInputContainer}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => setEstrellasNueva(n)}>
          <Ionicons
            name={n <= estrellasNueva ? "star" : "star-outline"}
            size={28}
            color={n <= estrellasNueva ? '#FFD700' : '#ccc'}
            style={styles.estrellaInput}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  // POST al backend
  const enviarComentario = async () => {
    if (!comentarioNuevo.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }
    try {
      const idUsuario = user?.idUsuario || user?.id || user?.usuario?.idUsuario;
      if (!idUsuario) {
        Alert.alert('Error', 'No se encontró el usuario');
        return;
      }
      
      const token = await AsyncStorage.getItem('token');
      const body = {
        calificacion: estrellasNueva,
        comentarios: comentarioNuevo.trim(),
        usuario: { idUsuario: idUsuario },
        receta: { idReceta: id }
      };
      
      const res = await fetch('http://192.168.1.31:8080/api/calificaciones', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) throw new Error('No se pudo guardar la calificación');
      
      setComentarioNuevo('');
      setEstrellasNueva(5);
      Alert.alert('Gracias', 'Tu comentario fue agregado y quedará pendiente de aprobación.');
      
      // Refresca comentarios
      const califRes = await fetch(`http://192.168.1.31:8080/api/calificaciones/receta/${id}`);
      if (califRes.ok) {
        const califs = await califRes.json();
        setCalificaciones(califs);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la calificación');
    }
  };

  // ✅ Formatear tiempo de preparación
  const formatearTiempo = (minutos?: number) => {
    if (!minutos) return '60 min';
    
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
  };

  if (loading || !receta) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B5399" />
        <Text style={styles.loadingText}>Cargando receta...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* ✅ Imagen de portada con overlay */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: receta.fotoPrincipal }} style={styles.imagen} />
            <View style={styles.imageOverlay}>
              <View style={styles.titleContainer}>
                <Text style={styles.titulo}>{receta.nombreReceta}</Text>
                
                {/* ✅ BOTÓN DE FAVORITOS */}
                {user && (
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={toggleFavorito}
                    disabled={loadingFavorito}
                  >
                    {loadingFavorito ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons
                        name={isFavorito ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorito ? "#ff6b6b" : "white"}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* ✅ Información básica de la receta */}
          <View style={styles.contentContainer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={20} color="#2B5399" />
                <Text style={styles.infoText}>{cantidadPersonas} personas</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#2B5399" />
                <Text style={styles.infoText}>{formatearTiempo(receta.tiempoPreparacion)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="bar-chart-outline" size={20} color="#2B5399" />
                <Text style={styles.infoText}>{receta.dificultad || 'Media'}</Text>
              </View>
            </View>

            {/* ✅ Información del autor */}
            <View style={styles.autorCard}>
              <Image
                source={{ 
                  uri: receta.usuario?.avatar 
                    ? `data:image/jpeg;base64,${receta.usuario.avatar}`
                    : 'https://ui-avatars.com/api/?name=' + (receta.usuario?.nombre || 'User')
                }}
                style={styles.autorAvatar}
              />
              <View style={styles.autorInfo}>
                <Text style={styles.autorNombre}>Por: {receta.usuario?.nombre || 'Chef Anónimo'}</Text>
                <Text style={styles.autorSubtitle}>Creador de la receta</Text>
              </View>
            </View>

            {/* ✅ Descripción */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Descripción</Text>
              <Text style={styles.sectionText}>{receta.descripcionReceta || 'Sin descripción disponible'}</Text>
            </View>

            {/* ✅ Control de porciones */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Cantidad de personas</Text>
              <View style={styles.porcionesCard}>
                <TouchableOpacity
                  style={styles.porcionButton}
                  onPress={() => setCantidadPersonas(prev => Math.max(1, prev - 1))}
                >
                  <Ionicons name="remove" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.porcionesText}>{cantidadPersonas}</Text>
                <TouchableOpacity
                  style={styles.porcionButton}
                  onPress={() => setCantidadPersonas(prev => Math.min(10, prev + 1))}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ✅ Ingredientes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥘 Ingredientes</Text>
              <View style={styles.ingredientesCard}>
                {(receta.ingredientes || []).map((item: any, index: number) => (
                  <View key={index}>{renderIngrediente({ item })}</View>
                ))}
              </View>
            </View>

            {/* ✅ Pasos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍🍳 Preparación</Text>
              <View style={styles.pasosCard}>
                {pasos.length > 0 ? (
                  pasos.map((paso, idx) => (
                    <View key={idx} style={styles.pasoItem}>
                      <View style={styles.pasoNumero}>
                        <Text style={styles.pasoNumeroText}>{paso.nroPaso}</Text>
                      </View>
                      <Text style={styles.pasoTexto}>{paso.texto}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sinPasosText}>No hay pasos de preparación disponibles.</Text>
                )}
              </View>
            </View>

            {/* ✅ Calificación */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Calificación</Text>
              <View style={styles.calificacionCard}>
                {calificaciones.length > 0 ? (
                  <View style={styles.calificacionHeader}>
                    {renderEstrellas(promedioEstrellas)}
                    <Text style={styles.calificacionTexto}>
                      {promedioEstrellas.toFixed(1)}/5 ({calificaciones.length} reseña{calificaciones.length !== 1 ? 's' : ''})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.sinCalificacionText}>Esta receta aún no tiene calificaciones.</Text>
                )}
              </View>
            </View>

            {/* ✅ Comentarios */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Comentarios</Text>
              <View style={styles.comentariosCard}>
                {calificaciones.length > 0 ? (
                  calificaciones.map((comentario, index) => (
                    <View key={index} style={styles.comentarioItem}>
                      <Image
                        source={{ 
                          uri: 'https://ui-avatars.com/api/?name=' + (comentario.usuario?.nombre || 'User') 
                        }}
                        style={styles.comentarioAvatar}
                      />
                      <View style={styles.comentarioContent}>
                        <View style={styles.comentarioHeader}>
                          <Text style={styles.comentarioAutor}>
                            {comentario.usuario?.nombre || 'Anónimo'}
                          </Text>
                          {renderEstrellas(comentario.calificacion || 0)}
                        </View>
                        <Text style={styles.comentarioTexto}>{comentario.comentarios}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sinComentariosText}>No hay comentarios aún. ¡Sé el primero en comentar!</Text>
                )}
              </View>
            </View>

            {/* ✅ Agregar comentario */}
            {user && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✍️ Agregar comentario</Text>
                <View style={styles.nuevoComentarioCard}>
                  <TextInput
                    placeholder="Escribí tu comentario sobre esta receta..."
                    style={styles.comentarioInput}
                    value={comentarioNuevo}
                    onChangeText={setComentarioNuevo}
                    multiline
                    numberOfLines={4}
                  />
                  
                  <View style={styles.estrellasSection}>
                    <Text style={styles.estrellasLabel}>Tu calificación:</Text>
                    {renderEstrellasInput()}
                  </View>
                  
                  <TouchableOpacity style={styles.enviarButton} onPress={enviarComentario}>
                    <Ionicons name="send" size={16} color="white" />
                    <Text style={styles.enviarButtonText}>Enviar comentario</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ✅ Botones de acción */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
                <Text style={styles.backButtonText}>Volver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  imagen: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  contentContainer: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  autorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  autorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  autorInfo: {
    flex: 1,
  },
  autorNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 2,
  },
  autorSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2B5399',
  },
  porcionesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  porcionButton: {
    backgroundColor: '#2B5399',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  porcionesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B5399',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  ingredientesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ingredienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredienteText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    flex: 1,
  },
  pasosCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pasoItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  pasoNumero: {
    backgroundColor: '#2B5399',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pasoNumeroText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pasoTexto: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
    paddingTop: 6,
  },
  sinPasosText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  calificacionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calificacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calificacionTexto: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  sinCalificacionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  estrellasContainer: {
    flexDirection: 'row',
  },
  estrella: {
    marginHorizontal: 1,
  },
  comentariosCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comentarioItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  comentarioAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  comentarioContent: {
    flex: 1,
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comentarioAutor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  comentarioTexto: {
    fontSize: 14,
    color: '#444',
    lineHeight: 18,
  },
  sinComentariosText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  nuevoComentarioCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comentarioInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  estrellasSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  estrellasLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  estrellasInputContainer: {
    flexDirection: 'row',
  },
  estrellaInput: {
    marginHorizontal: 2,
  },
  enviarButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  enviarButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#6c757d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});