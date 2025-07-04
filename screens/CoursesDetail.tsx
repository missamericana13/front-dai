import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Curso {
  idCurso: number;
  nombre: string;
  descripcion?: string;
  contenidos?: string;
  requerimientos?: string;
  imagenUrl?: string;
  imagen?: string;
  duracion?: number;
  precio?: number;
  modalidad?: string;
}

interface Sede {
  idSede: number;
  nombreSede: string;
  direccionSede: string;
  telefonoSede?: string;
  mailSede?: string;
  whatsApp?: string;
}

interface Cronograma {
  idCronograma: number;
  horario: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadClases?: number;
  vacantesDisponibles?: number;
  sede: Sede;
  curso: Curso;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [selectedCronograma, setSelectedCronograma] = useState<string | null>(null);
  const [selectedSede, setSelectedSede] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        
        // Obtener curso
        const resCurso = await fetch(`http://192.168.1.31:8080/api/cursos/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resCurso.ok) throw new Error('No se pudo cargar el curso');
        const dataCurso = await resCurso.json();
        
        // Procesar imagen
        let finalImageUrl = '';
        if (dataCurso.imagen) {
          finalImageUrl = `data:image/jpeg;base64,${dataCurso.imagen}`;
        } else if (dataCurso.imagenUrl) {
          finalImageUrl = dataCurso.imagenUrl.startsWith('http') 
            ? dataCurso.imagenUrl 
            : `http://192.168.1.31:8080${dataCurso.imagenUrl}`;
        } else {
          finalImageUrl = `https://picsum.photos/400/160?random=${id}`;
        }
        
        setCurso({ ...dataCurso, imagenUrl: finalImageUrl });

        // Obtener cronogramas específicos del curso
        const resCrono = await fetch(`http://192.168.1.31:8080/api/cronogramas?cursoId=${id}`);
        const dataCrono = resCrono.ok ? await resCrono.json() : [];
        setCronogramas(dataCrono);
        
        if (dataCrono.length > 0) {
          setSelectedSede(dataCrono[0].sede.idSede);
          setSelectedCronograma(dataCrono[0].idCronograma.toString());
        }
      } catch (e) {
        Alert.alert('Error', 'No se pudo cargar el curso');
        setCurso(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInscribirme = async () => {
    if (!selectedCronograma) {
      Alert.alert('Selecciona un horario');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para inscribirte');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Obtener ID del alumno
      const alumnoRes = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!alumnoRes.ok) {
        Alert.alert('No puedes inscribirte', 'Debes ser alumno para inscribirte en un curso.');
        return;
      }
      
      const alumnoData = await alumnoRes.json();
      const idAlumno = alumnoData.idAlumno;
      
      // Realizar inscripción
      const res = await fetch(
        `http://192.168.1.31:8080/api/cursos/inscribir?idAlumno=${idAlumno}&idCronograma=${selectedCronograma}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorText = await res.text();
          Alert.alert('No puedes inscribirte', errorText || 'Error en la inscripción.');
        } else {
          Alert.alert('Error', 'No se pudo inscribir');
        }
        return;
      }

      // ✅ Marcar que se realizó una inscripción para actualizar el historial
      await AsyncStorage.setItem('historialNeedsRefresh', 'true');

      Alert.alert(
        '¡Inscripción exitosa!', 
        'Te has inscrito correctamente al curso. El movimiento aparecerá en tu historial de compras.',
        [
          {
            text: 'Ver mi historial',
            onPress: () => router.push('/drawer/(tabs)/currentaccount')
          },
          {
            text: 'Ver cursos',
            onPress: () => router.push('/drawer/courses')
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la inscripción');
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  // Agrupar cronogramas por sede
  const sedesDisponibles = cronogramas.reduce((acc: any[], cronograma) => {
    const sedeExistente = acc.find(item => item.sede.idSede === cronograma.sede.idSede);
    if (sedeExistente) {
      sedeExistente.cronogramas.push(cronograma);
    } else {
      acc.push({
        sede: cronograma.sede,
        cronogramas: [cronograma]
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B5399" />
        <Text style={styles.loadingText}>Cargando curso...</Text>
      </View>
    );
  }

  if (!curso) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>No se pudo cargar el curso</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Imagen de portada */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: curso.imagenUrl }} 
          style={styles.imagen}
          onError={() => console.log('Error cargando imagen del curso')}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.titulo}>{curso.nombre}</Text>
        </View>
      </View>

      {/* Información del curso */}
      <View style={styles.contentContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#2B5399" />
            <Text style={styles.infoText}>{curso.duracion || '-'} clases</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#2B5399" />
            <Text style={styles.infoText}>{curso.modalidad || 'Sin modalidad'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color="#2B5399" />
            <Text style={styles.infoText}>${curso.precio ?? 'Consultar'}</Text>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Descripción</Text>
          <Text style={styles.sectionText}>{curso.descripcion || 'Sin descripción disponible'}</Text>
        </View>

        {/* Contenidos */}
        {curso.contenidos && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Contenidos</Text>
            <Text style={styles.sectionText}>{curso.contenidos}</Text>
          </View>
        )}

        {/* Requerimientos */}
        {curso.requerimientos && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Requerimientos</Text>
            <Text style={styles.sectionText}>{curso.requerimientos}</Text>
          </View>
        )}

        {/* Sedes y horarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏫 Sedes y horarios disponibles</Text>
          
          {sedesDisponibles.length > 0 ? (
            <>
              {/* Selector de sedes */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sedesScroll}>
                {sedesDisponibles.map(({ sede }) => (
                  <TouchableOpacity
                    key={sede.idSede}
                    style={[
                      styles.sedeChip,
                      selectedSede === sede.idSede && styles.sedeChipSelected
                    ]}
                    onPress={() => {
                      setSelectedSede(sede.idSede);
                      const primeraOpcion = sedesDisponibles
                        .find(s => s.sede.idSede === sede.idSede)?.cronogramas[0];
                      if (primeraOpcion) {
                        setSelectedCronograma(primeraOpcion.idCronograma.toString());
                      }
                    }}
                  >
                    <Text style={[
                      styles.sedeChipText,
                      selectedSede === sede.idSede && styles.sedeChipTextSelected
                    ]}>
                      {sede.nombreSede}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Información de la sede seleccionada */}
              {selectedSede && (
                <View style={styles.sedeInfo}>
                  {(() => {
                    const sedeActual = sedesDisponibles.find(s => s.sede.idSede === selectedSede);
                    return sedeActual ? (
                      <>
                        <View style={styles.sedeHeader}>
                          <Ionicons name="location" size={20} color="#2B5399" />
                          <Text style={styles.sedeNombre}>{sedeActual.sede.nombreSede}</Text>
                        </View>
                        <Text style={styles.sedeDireccion}>{sedeActual.sede.direccionSede}</Text>
                        
                        {/* Horarios disponibles */}
                        <Text style={styles.horariosTitle}>Horarios disponibles:</Text>
                        {sedeActual.cronogramas.map((cronograma) => (
                          <TouchableOpacity
                            key={cronograma.idCronograma}
                            style={[
                              styles.horarioCard,
                              selectedCronograma === cronograma.idCronograma.toString() && styles.horarioCardSelected
                            ]}
                            onPress={() => setSelectedCronograma(cronograma.idCronograma.toString())}
                          >
                            <View style={styles.horarioHeader}>
                              <View style={styles.horarioInfo}>
                                <Text style={styles.horarioTime}>🕒 {cronograma.horario}</Text>
                                <Text style={styles.horarioFechas}>
                                  📅 {formatFecha(cronograma.fechaInicio)} - {formatFecha(cronograma.fechaFin)}
                                </Text>
                              </View>
                              {selectedCronograma === cronograma.idCronograma.toString() && (
                                <Ionicons name="checkmark-circle" size={24} color="#2B5399" />
                              )}
                            </View>
                            
                            {cronograma.vacantesDisponibles !== undefined && (
                              <Text style={styles.vacantes}>
                                👥 {cronograma.vacantesDisponibles} vacantes disponibles
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : null;
                  })()}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noSedesContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.noSedesText}>No hay horarios disponibles para este curso</Text>
            </View>
          )}
        </View>

        {/* Botón de inscripción - MEJORADO */}
        {userRole === 'alumno' ? (
          sedesDisponibles.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.inscribirButton,
                !selectedCronograma && styles.inscribirButtonDisabled
              ]}
              onPress={handleInscribirme}
              disabled={!selectedCronograma}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.inscribirButtonText}>
                {selectedCronograma ? 'Inscribirme al curso' : 'Selecciona un horario'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noInscripcionContainer}>
              <Ionicons name="calendar-outline" size={32} color="#ccc" />
              <Text style={styles.noInscripcionText}>
                No hay horarios disponibles para inscripción
              </Text>
            </View>
          )
        ) : userRole === 'visitante' || !userRole ? (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Ionicons name="log-in-outline" size={20} color="white" />
            <Text style={styles.loginButtonText}>Inicia sesión para inscribirte</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noInscripcionContainer}>
            <Ionicons name="person-outline" size={32} color="#ccc" />
            <Text style={styles.noInscripcionText}>
              Solo los alumnos pueden inscribirse en cursos
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
  sedesScroll: {
    marginBottom: 16,
  },
  sedeChip: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sedeChipSelected: {
    backgroundColor: '#2B5399',
    borderColor: '#2B5399',
  },
  sedeChipText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  sedeChipTextSelected: {
    color: 'white',
  },
  sedeInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sedeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sedeNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginLeft: 8,
  },
  sedeDireccion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  horariosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  horarioCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  horarioCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2B5399',
  },
  horarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horarioInfo: {
    flex: 1,
  },
  horarioTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  horarioFechas: {
    fontSize: 12,
    color: '#666',
  },
  vacantes: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 8,
    fontWeight: '500',
  },
  noSedesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  noSedesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inscribirButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  inscribirButtonDisabled: {
    backgroundColor: '#999',
    elevation: 1,
  },
  inscribirButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noInscripcionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noInscripcionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});