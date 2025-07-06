import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';

const { width } = Dimensions.get('window');

const getPlaceholderImage = (courseId: number): string => {
  const placeholderImages = [
    'https://images.pexels.com/photos/1251208/pexels-photo-1251208.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop', // Bread making
    'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop', // Kitchen utensils
    'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop', // Cooking class
    'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop', // Baking ingredients
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop', // Chef working
  ];
  
  const imageIndex = courseId % placeholderImages.length;
  return placeholderImages[imageIndex];
};

const isValidImageBase64 = (base64String: string): boolean => {
  try {
    if (!base64String || base64String.trim() === '') {
      return false;
    }

    const decoded = atob(base64String);
    
    if (decoded.startsWith('http')) {
      const isImageUrl = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(decoded) ||
                        decoded.includes('pexels.com') ||
                        decoded.includes('unsplash.com') ||
                        decoded.includes('images.');
      
      if (isImageUrl) {
        console.log('✅ Base64 contiene URL de imagen válida:', decoded);
        return true;
      } else {
        console.log('⚠️ Base64 contiene URL, pero no es de imagen');
        return false;
      }
    }
    
    if (decoded.length < 100) {
      console.log('⚠️ Base64 demasiado corto para ser imagen');
      return false;
    }
    
    return true;
  } catch (e) {
    console.log('⚠️ Error validando Base64:', e);
    return false;
  }
};

export default function MyCourseDetailScreen() {
  const { id, idAsistencia, imageUrl } = useLocalSearchParams<{ 
    id: string; 
    idAsistencia: string; 
    imageUrl?: string; 
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const [curso, setCurso] = useState<any>(null);
  const [asistencia, setAsistencia] = useState<any>(null);
  const [historialAsistencia, setHistorialAsistencia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        
        const cursoRes = await fetch(`http://192.168.1.31:8080/api/cursos/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!cursoRes.ok) throw new Error('No se pudo cargar el curso');
        const cursoData = await cursoRes.json();
        
        let imageUrlToUse = '';
        
        if (imageUrl && imageUrl !== 'undefined' && imageUrl.trim() !== '') {
          imageUrlToUse = decodeURIComponent(imageUrl);
          console.log('✅ Usando imagen del listado en MyCourses:', imageUrlToUse);
        } else if (cursoData.imagen && isValidImageBase64(cursoData.imagen)) {
          const decoded = atob(cursoData.imagen);
          
          if (decoded.startsWith('http')) {
            imageUrlToUse = decoded;
            console.log('🔗 Usando URL decodificada del backend en MyCourses:', decoded);
          } else {
            imageUrlToUse = `data:image/jpeg;base64,${cursoData.imagen}`;
            console.log('✅ Usando imagen Base64 del backend en MyCourses');
          }
        } else if (cursoData.imagenUrl) {
          imageUrlToUse = cursoData.imagenUrl.startsWith('http') 
            ? cursoData.imagenUrl 
            : `http://192.168.1.31:8080${cursoData.imagenUrl}`;
          console.log('🔗 Usando imagenUrl del backend en MyCourses:', imageUrlToUse);
        } else {
          imageUrlToUse = getPlaceholderImage(cursoData.idCurso);
          console.log('⚠️ Usando placeholder para curso en MyCourses:', cursoData.idCurso);
        }
        
        setFinalImageUrl(imageUrlToUse);
        setCurso({ ...cursoData, imagenUrl: imageUrlToUse });

        if (idAsistencia) {
          const asistenciaRes = await fetch(`http://192.168.1.31:8080/api/asistencias/${idAsistencia}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (asistenciaRes.ok) {
            const asistenciaData = await asistenciaRes.json();
            setAsistencia(asistenciaData);
            
            await fetchHistorialAsistencia(asistenciaData, token);
          }
        } else {
          await fetchAsistenciaByUser(token);
        }
      } catch (e) {
        console.error('❌ Error cargando curso en MyCourses:', e);
        Alert.alert('Error', 'No se pudo cargar la información del curso');
        setCurso(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, idAsistencia, imageUrl]);

  const handleImageError = () => {
    console.log('⚠️ Error cargando imagen en MyCourses, usando placeholder');
    if (curso) {
      const placeholderUrl = getPlaceholderImage(curso.idCurso);
      setFinalImageUrl(placeholderUrl);
      setCurso({ ...curso, imagenUrl: placeholderUrl });
    }
  };

  const fetchHistorialAsistencia = async (asistenciaData: any, token: string | null) => {
    if (!asistenciaData?.alumno?.idAlumno || !asistenciaData?.cronogramaCurso?.idCronograma) return;
    
    try {
      const historialRes = await fetch(
        `http://192.168.1.31:8080/api/cursos/historial-asistencia?idAlumno=${asistenciaData.alumno.idAlumno}&idCronograma=${asistenciaData.cronogramaCurso.idCronograma}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (historialRes.ok) {
        const historialData = await historialRes.json();
        console.log('📋 Historial completo recibido:', JSON.stringify(historialData, null, 2));
        
        historialData.forEach((registro, index) => {
          console.log(`📝 Registro ${index}:`, Object.keys(registro));
          console.log(`📅 Campos disponibles:`, {
            fechaHora: registro.fechaHora,
            fechaAsistencia: registro.fechaAsistencia,
            id: registro.id
          });
        });
        
        setHistorialAsistencia(historialData);
      }
    } catch (error) {
      console.error('Error cargando historial de asistencia:', error);
    }
  };

  const fetchAsistenciaByUser = async (token: string | null) => {
    if (!user?.id) return;
    
    try {
      const alumnoRes = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!alumnoRes.ok) return;
      
      const alumnoData = await alumnoRes.json();
      const idAlumno = alumnoData.idAlumno;
      
      const cursosRes = await fetch(`http://192.168.1.31:8080/api/cursos/inscriptos?idAlumno=${idAlumno}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (cursosRes.ok) {
        const cursosData = await cursosRes.json();
        const asistenciaEncontrada = cursosData.find((item: any) => 
          item.cronogramaCurso?.curso?.idCurso?.toString() === id
        );
        
        if (asistenciaEncontrada) {
          setAsistencia(asistenciaEncontrada);
          await fetchHistorialAsistencia(asistenciaEncontrada, token);
        }
      }
    } catch (error) {
      console.error('Error obteniendo asistencia por usuario:', error);
    }
  };

  const formatFechaAsistencia = (registro: any) => {
    const fechaString = registro.fechaHora || registro.fechaAsistencia;
    
    console.log('🔍 Registro completo:', registro);
    console.log('📅 Fecha encontrada (fechaHora):', fechaString);
    
    if (!fechaString) {
      console.warn('❌ No se encontró fecha en el registro');
      return { fecha: 'Fecha no disponible', hora: '--:--' };
    }
    
    try {
      let fecha: Date;
      
      if (typeof fechaString === 'string') {
        if (fechaString.includes('T')) {
          fecha = new Date(fechaString);
        }
        else if (!isNaN(Number(fechaString))) {
          fecha = new Date(Number(fechaString));
        }
        else {
          fecha = new Date(fechaString);
        }
      } else if (typeof fechaString === 'number') {
        fecha = new Date(fechaString);
      } else {
        fecha = new Date(fechaString);
      }
      
      if (isNaN(fecha.getTime())) {
        console.warn('❌ Fecha inválida después del parsing:', fechaString);
        return { fecha: 'Fecha inválida', hora: '--:--' };
      }
      
      const fechaFormateada = fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const horaFormateada = fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log('✅ Fecha parseada correctamente:', fechaFormateada, horaFormateada);
      return { fecha: fechaFormateada, hora: horaFormateada };
      
    } catch (error) {
      console.error('❌ Error parseando fecha:', fechaString, error);
      return { fecha: 'Error en fecha', hora: '--:--' };
    }
  };

  const handleDarseDeBaja = async () => {
    if (!asistencia?.idAsistencia) {
      Alert.alert('Error', 'No se puede dar de baja');
      return;
    }

    const getDiasHastaInicio = (fechaInicio: string): number => {
      const hoy = new Date();
      const inicio = new Date(fechaInicio);
      const diffTime = inicio.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const fechaInicio = asistencia?.cronogramaCurso?.fechaInicio;
    const diasHastaInicio = getDiasHastaInicio(fechaInicio);
    
    let porcentajeReintegro = 0;
    let condicion = '';
    
    if (diasHastaInicio >= 10) {
      porcentajeReintegro = 100;
      condicion = 'Reintegro completo (100%)';
    } else if (diasHastaInicio >= 1) {
      porcentajeReintegro = 70;
      condicion = 'Reintegro del 70%';
    } else if (diasHastaInicio === 0) {
      porcentajeReintegro = 50;
      condicion = 'Reintegro del 50% (día de inicio)';
    } else {
      porcentajeReintegro = 0;
      condicion = 'Sin reintegro (curso iniciado)';
    }

    const montoPagado = curso?.precio || 0;
    const montoReintegro = (montoPagado * porcentajeReintegro) / 100;

    Alert.alert(
      'Confirmar baja',
      `¿Estás seguro que quieres darte de baja de este curso?\n\n` +
      `Monto original: ${formatMonto(montoPagado)}\n` +
      `Reintegro: ${formatMonto(montoReintegro)} (${porcentajeReintegro}%)\n\n` +
      `${condicion}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar baja',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const res = await fetch(
                `http://192.168.1.31:8080/api/cursos/baja?idAlumno=${asistencia.alumno.idAlumno}&idCronograma=${asistencia.cronogramaCurso.idCronograma}`,
                {
                  method: 'POST',
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );
              
              if (!res.ok) {
                const errorText = await res.text();
                console.error('Error en la baja:', errorText);
                Alert.alert('Error', errorText || 'No se pudo procesar la baja');
                return;
              }

              await AsyncStorage.setItem('historialNeedsRefresh', 'true');
              
              Alert.alert(
                'Baja exitosa', 
                `Te has dado de baja del curso exitosamente.\n\nReintegro procesado: ${formatMonto(montoReintegro)}`,
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    router.back();
                  }
                }]
              );
            } catch (e) {
              console.error('Error procesando baja:', e);
              Alert.alert('Error', 'No se pudo procesar la baja');
            }
          }
        }
      ]
    );
  };

  const handleLeerQR = () => {
    Alert.alert(
      'Registrar asistencia',
      'Para registrar tu asistencia debes:\n\n' +
      '1. Estar en la sede del curso\n' +
      '2. Escanear el código QR del ingreso\n' +
      '3. Escanear el código QR del aula\n\n' +
      'Esto registrará automáticamente tu asistencia.',
      [
        { text: 'Entendido', style: 'default' },
        {
          text: 'Simular QR (Demo)',
          style: 'default',
          onPress: handleRegistrarAsistenciaDemo
        }
      ]
    );
  };

  const handleRegistrarAsistenciaDemo = async () => {
    if (!asistencia?.alumno?.idAlumno || !asistencia?.cronogramaCurso?.idCronograma) {
      Alert.alert('Error', 'No se puede registrar la asistencia');
      return;
    }

    setLoadingAsistencia(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `http://192.168.1.31:8080/api/cursos/registrar-asistencia?idAlumno=${asistencia.alumno.idAlumno}&idCronograma=${asistencia.cronogramaCurso.idCronograma}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        Alert.alert('Error', errorText || 'No se pudo registrar la asistencia');
        return;
      }
      
      Alert.alert('Éxito', 'Asistencia registrada correctamente mediante QR');
      
      console.log('🔄 Recargando historial de asistencia...');
      const tokenRefresh = await AsyncStorage.getItem('token');
      await fetchHistorialAsistencia(asistencia, tokenRefresh);
      
    } catch (e) {
      console.error('Error registrando asistencia:', e);
      Alert.alert('Error', 'No se pudo registrar la asistencia');
    } finally {
      setLoadingAsistencia(false);
    }
  };

  const checkAprobacion = async () => {
    if (!asistencia?.alumno?.idAlumno || !asistencia?.cronogramaCurso?.idCronograma) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `http://192.168.1.31:8080/api/cursos/aprobacion?idAlumno=${asistencia.alumno.idAlumno}&idCronograma=${asistencia.cronogramaCurso.idCronograma}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (res.ok) {
        const aprobado = await res.json();
        
        const totalClases = curso?.duracion || 0;
        const asistenciasRegistradas = historialAsistencia.length;
        const porcentajeAsistencia = totalClases > 0 ? (asistenciasRegistradas / totalClases) * 100 : 0;
        const requierePorcentaje = 75; 
        
        Alert.alert(
          'Estado de aprobación',
          `${aprobado ? '✅ Has aprobado el curso' : '❌ Aún no has aprobado el curso'}\n\n` +
          `📊 Estadísticas:\n` +
          `• Asistencias: ${asistenciasRegistradas}/${totalClases}\n` +
          `• Porcentaje: ${porcentajeAsistencia.toFixed(1)}%\n` +
          `• Requerido: ${requierePorcentaje}%\n\n` +
          `${porcentajeAsistencia >= requierePorcentaje ? 
            '✅ Cumples con el requisito de asistencia' : 
            '⚠️ Necesitas más asistencias para aprobar'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el estado de aprobación');
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    const [y, m, d] = fecha.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B5399" />
        <Text style={styles.loadingText}>Cargando detalles del curso...</Text>
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

  const isActivo = !asistencia?.fechaBaja;
  const cronograma = asistencia?.cronogramaCurso;

  const totalClases = curso?.duracion || 0;
  const asistenciasRegistradas = historialAsistencia.length;
  const porcentajeAsistencia = totalClases > 0 ? (asistenciasRegistradas / totalClases) * 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ✅ MEJORADO: Imagen de portada con mejor manejo de errores */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: finalImageUrl }} 
          style={styles.imagen}
          onError={handleImageError}
          onLoadStart={() => console.log(`📸 Cargando imagen en MyCourses: ${finalImageUrl}`)}
          onLoad={() => console.log(`✅ Imagen cargada en MyCourses para curso ${curso.idCurso}`)}
          onLoadEnd={() => console.log(`🏁 Carga finalizada en MyCourses para curso ${curso.idCurso}`)}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.titulo}>{curso.nombre}</Text>
          <View style={[styles.statusBadge, isActivo ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>
              {isActivo ? '✅ Activo' : '❌ Dado de baja'}
            </Text>
          </View>
        </View>
      </View>

      {/* Información básica del curso */}
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
            <Text style={styles.infoText}>{formatMonto(curso.precio || 0)}</Text>
          </View>
        </View>

        {/* Información de la inscripción */}
        {cronograma && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Tu inscripción</Text>
            <View style={styles.inscripcionCard}>
              <View style={styles.inscripcionRow}>
                <Ionicons name="business-outline" size={18} color="#2B5399" />
                <Text style={styles.inscripcionText}>
                  {cronograma.sede?.nombreSede || 'Sin sede asignada'}
                </Text>
              </View>
              <View style={styles.inscripcionRow}>
                <Ionicons name="time-outline" size={18} color="#2B5399" />
                <Text style={styles.inscripcionText}>
                  {cronograma.horario || 'Horario por confirmar'}
                </Text>
              </View>
              {cronograma.fechaInicio && (
                <View style={styles.inscripcionRow}>
                  <Ionicons name="calendar-outline" size={18} color="#2B5399" />
                  <Text style={styles.inscripcionText}>
                    {formatFecha(cronograma.fechaInicio)} - {formatFecha(cronograma.fechaFin)}
                  </Text>
                </View>
              )}
              <View style={styles.inscripcionRow}>
                <Ionicons name="card-outline" size={18} color="#2B5399" />
                <Text style={styles.inscripcionText}>
                  Pagado: {formatMonto(curso.precio || 0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Descripción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Descripción</Text>
          <Text style={styles.sectionText}>{curso.descripcion || 'Sin descripción disponible'}</Text>
        </View>

        {/* Contenidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Contenidos del curso</Text>
          <Text style={styles.sectionText}>{curso.contenidos || 'Contenidos no especificados'}</Text>
        </View>

        {/* Requerimientos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Requerimientos</Text>
          <Text style={styles.sectionText}>{curso.requerimientos || 'No hay requerimientos especiales'}</Text>
        </View>

        {/* ✅ SECCIÓN DE ASISTENCIAS MEJORADA CON QR */}
        {isActivo && asistencia && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Asistencias</Text>
            <View style={styles.asistenciaCard}>
              <View style={styles.asistenciaHeader}>
                <Text style={styles.asistenciaTitle}>Control de asistencia</Text>
                <TouchableOpacity 
                  style={[styles.qrButton, loadingAsistencia && styles.qrButtonDisabled]} 
                  onPress={handleLeerQR}
                  disabled={loadingAsistencia}
                >
                  <Ionicons name="qr-code" size={16} color="white" />
                  <Text style={styles.qrButtonText}>
                    {loadingAsistencia ? 'Procesando...' : 'Escanear QR'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ✅ Estadísticas de asistencia */}
              <View style={styles.estadisticasCard}>
                <View style={styles.estadisticaRow}>
                  <View style={styles.estadisticaItem}>
                    <Text style={styles.estadisticaNumero}>{asistenciasRegistradas}</Text>
                    <Text style={styles.estadisticaLabel}>Asistencias</Text>
                  </View>
                  <View style={styles.estadisticaItem}>
                    <Text style={styles.estadisticaNumero}>{totalClases}</Text>
                    <Text style={styles.estadisticaLabel}>Total clases</Text>
                  </View>
                  <View style={styles.estadisticaItem}>
                    <Text style={[
                      styles.estadisticaNumero, 
                      { color: porcentajeAsistencia >= 75 ? '#28a745' : '#dc3545' }
                    ]}>
                      {porcentajeAsistencia.toFixed(0)}%
                    </Text>
                    <Text style={styles.estadisticaLabel}>Asistencia</Text>
                  </View>
                </View>
                
                {/* Barra de progreso */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(porcentajeAsistencia, 100)}%`,
                          backgroundColor: porcentajeAsistencia >= 75 ? '#28a745' : '#dc3545'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    Mínimo requerido: 75% para aprobar
                  </Text>
                </View>
              </View>
              
              {/* ✅ HISTORIAL CON FECHAS CORREGIDAS */}
              {historialAsistencia.length > 0 ? (
                <View style={styles.historialContainer}>
                  <Text style={styles.historialTitle}>Historial de asistencias</Text>
                  {historialAsistencia.slice(-5).map((registro, index) => {
                    const { fecha, hora } = formatFechaAsistencia(registro);
                    
                    return (
                      <View key={registro.id || index} style={styles.registroAsistencia}>
                        <View style={styles.registroIcon}>
                          <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                        </View>
                        <View style={styles.registroInfo}>
                          <Text style={styles.fechaAsistencia}>{fecha}</Text>
                          <Text style={styles.horaAsistencia}>{hora}</Text>
                        </View>
                      </View>
                    );
                  })}
                  
                  <TouchableOpacity 
                    style={styles.verificarButton} 
                    onPress={checkAprobacion}
                  >
                    <Ionicons name="shield-checkmark-outline" size={16} color="white" />
                    <Text style={styles.verificarButtonText}>Verificar Estado de Aprobación</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.sinAsistenciasContainer}>
                  <Ionicons name="qr-code-outline" size={32} color="#ccc" />
                  <Text style={styles.sinAsistencias}>No hay asistencias registradas aún</Text>
                  <Text style={styles.sinAsistenciasSubtext}>
                    Escanea el código QR en la sede para registrar tu asistencia
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          {isActivo && (
            <TouchableOpacity 
              style={styles.bajaButton} 
              onPress={handleDarseDeBaja}
            >
              <Ionicons name="exit-outline" size={20} color="white" />
              <Text style={styles.bajaButtonText}>Darme de baja</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.backButtonText}>Volver a mis cursos</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.9)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  inscripcionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inscripcionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inscripcionText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 12,
    flex: 1,
  },
  asistenciaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  asistenciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  asistenciaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    flex: 1,
  },
  qrButton: {
    backgroundColor: '#17a2b8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  qrButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  estadisticasCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  estadisticaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historialContainer: {
    marginTop: 12,
  },
  historialTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 12,
  },
  registroAsistencia: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
  registroIcon: {
    marginRight: 12,
  },
  registroInfo: {
    flex: 1,
  },
  fechaAsistencia: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  horaAsistencia: {
    fontSize: 12,
    color: '#666',
  },
  verificarButton: {
    backgroundColor: '#17a2b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  verificarButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  sinAsistenciasContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  sinAsistencias: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sinAsistenciasSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  bajaButton: {
    backgroundColor: '#dc3545',
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
  bajaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#2B5399',
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