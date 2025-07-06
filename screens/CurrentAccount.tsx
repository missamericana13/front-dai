import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, RefreshControl
} from 'react-native';
import { useAuth } from '../context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

interface CuentaCorrienteMovimiento {
  id: number | string;
  tipoMovimiento: string;
  monto: number;
  descripcion: string;
  fechaMovimiento: string;
  saldoAnterior: number;
  saldoActual: number;
  idAsistencia?: number;
  nombreCurso?: string;
  nombreSede?: string;
}

interface CursoInscripto {
  idAsistencia: number;
  idInscripcion?: number;
  nombreCurso: string;
  nombreSede: string;
  direccionSede: string;
  horario: string;
  fechaInicio: string;
  fechaFin: string;
  montoPagado: number;
  estado: string;
  fechaInscripcion?: string;
  fechaBaja?: string;
  aprobado?: boolean;
  asistencia?: boolean;
  totalClases?: number;
  asistenciasRegistradas?: number;
  porcentajeAsistencia?: number | null;
}

interface HistorialCompras {
  movimientos: CuentaCorrienteMovimiento[];
  cursosInscriptos: CursoInscripto[];
}

export default function HistorialComprasScreen() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [historialData, setHistorialData] = useState<HistorialCompras | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursos' | 'movimientos'>('cursos');

  const fetchHistorialCompras = async () => {
    if (!user?.id || userRole !== 'alumno') return;

    try {
      const token = await AsyncStorage.getItem('token');
      
      const alumnoRes = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!alumnoRes.ok) {
        Alert.alert('Error', 'No se pudo obtener la información del alumno');
        return;
      }
      
      const alumnoData = await alumnoRes.json();
      const idAlumno = alumnoData.idAlumno;
      
      const cuentaRes = await fetch(`http://192.168.1.31:8080/api/cuenta-corriente/alumno/${idAlumno}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!cuentaRes.ok) {
        throw new Error('No se pudo cargar el historial');
      }
      
      const data = await cuentaRes.json();
      console.log('📊 Datos del historial:', JSON.stringify(data, null, 2));
      
      const movimientosConReintegros = [...(data.movimientos || [])];
      
      data.cursosInscriptos?.forEach((curso: any) => {
        if (curso.estado === 'CANCELADO' && curso.fechaBaja) {
          const yaExisteReintegro = movimientosConReintegros.some(mov => 
            mov.tipoMovimiento === 'CREDITO_REINTEGRO' && 
            mov.idAsistencia === curso.idAsistencia
          );
          
          if (!yaExisteReintegro) {
            const fechaBaja = new Date(curso.fechaBaja);
            const fechaInicio = new Date(curso.fechaInicio);
            const diffTime = fechaInicio.getTime() - fechaBaja.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let porcentajeReintegro = 0;
            if (diffDays >= 10) porcentajeReintegro = 100;
            else if (diffDays >= 1) porcentajeReintegro = 70;
            else if (diffDays === 0) porcentajeReintegro = 50;
            
            const montoReintegro = (curso.montoPagado * porcentajeReintegro) / 100;
            
            if (montoReintegro > 0) {
              movimientosConReintegros.push({
                id: `reintegro-${curso.idAsistencia}-${Date.now()}`,
                tipoMovimiento: 'CREDITO_REINTEGRO',
                monto: montoReintegro,
                descripcion: `Reintegro por baja del curso: ${curso.nombreCurso} - Reintegro ${porcentajeReintegro}%`,
                fechaMovimiento: curso.fechaBaja,
                saldoAnterior: 0,
                saldoActual: 0,
                idAsistencia: curso.idAsistencia,
                nombreCurso: curso.nombreCurso,
                nombreSede: curso.nombreSede
              });
            }
          }
        }
      });
      
      const cursosOrdenados = (data.cursosInscriptos || []).sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaInscripcion || a.fechaInicio);
        const fechaB = new Date(b.fechaInscripcion || b.fechaInicio);
        return fechaB.getTime() - fechaA.getTime();
      });
      
      setHistorialData({
        movimientos: movimientosConReintegros,
        cursosInscriptos: cursosOrdenados
      });
    } catch (error) {
      console.error('Error fetching historial:', error);
      Alert.alert('Error', 'No se pudo cargar el historial de compras');
    }
  };

  useEffect(() => {
    if (userRole !== 'alumno') {
      Alert.alert('Acceso denegado', 'Solo los alumnos pueden ver su historial de compras');
      router.back();
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      await fetchHistorialCompras();
      setLoading(false);
    };
    
    loadData();
  }, [user, userRole]);

  useFocusEffect(
    useCallback(() => {
      if (userRole === 'alumno' && !loading) {
        console.log('🔄 Pantalla enfocada - Actualizando historial...');
        fetchHistorialCompras();
      }
    }, [userRole, loading])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistorialCompras();
    setRefreshing(false);
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  const getTipoMovimientoInfo = (tipo: string) => {
    switch (tipo) {
      case 'DEBITO_INSCRIPCION':
        return { 
          icon: 'school-outline', 
          color: '#dc3545', 
          label: 'Pago de Curso',
          showAs: 'payment'
        };
      case 'CREDITO_REINTEGRO':
        return { 
          icon: 'arrow-back-circle-outline', 
          color: '#28a745', 
          label: 'Reintegro por Baja',
          showAs: 'credit'
        };
      case 'CREDITO_SALDO':
        return { 
          icon: 'add-circle-outline', 
          color: '#28a745', 
          label: 'Carga de Saldo',
          showAs: 'credit'
        };
      case 'DEBITO_APLICACION':
        return { 
          icon: 'remove-circle-outline', 
          color: '#dc3545', 
          label: 'Aplicación de Saldo',
          showAs: 'debit'
        };
      default:
        return { 
          icon: 'help-circle-outline', 
          color: '#6c757d', 
          label: 'Movimiento',
          showAs: 'neutral'
        };
    }
  };

  const getEstadoCursoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return '#28a745';
      case 'FINALIZADO': return '#6c757d';
      case 'CANCELADO': return '#dc3545';
      default: return '#17a2b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B5399" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  if (!historialData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>No se pudo cargar el historial</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header simplificado */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mi Historial de Compras</Text>
        <Text style={styles.headerSubtitle}>Cursos contratados y historial de pagos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cursos' && styles.activeTab]}
          onPress={() => setActiveTab('cursos')}
        >
          <Ionicons 
            name="school-outline" 
            size={20} 
            color={activeTab === 'cursos' ? '#2B5399' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'cursos' && styles.activeTabText]}>
            Mis Cursos ({historialData.cursosInscriptos.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'movimientos' && styles.activeTab]}
          onPress={() => setActiveTab('movimientos')}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === 'movimientos' ? '#2B5399' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'movimientos' && styles.activeTabText]}>
            Historial de Pagos ({historialData.movimientos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de las tabs */}
      {activeTab === 'cursos' ? (
        <View style={styles.content}>
          {historialData.cursosInscriptos.length > 0 ? (
            historialData.cursosInscriptos.map((curso) => (
              <View key={curso.idAsistencia} style={styles.cursoCard}>
                <View style={styles.cursoHeader}>
                  <View style={styles.cursoInfo}>
                    <Text style={styles.cursoNombre}>{curso.nombreCurso}</Text>
                    <Text style={styles.cursoSede}>📍 {curso.nombreSede}</Text>
                  </View>
                  <View style={[styles.estadoBadge, { backgroundColor: getEstadoCursoColor(curso.estado) }]}>
                    <Text style={styles.estadoText}>{curso.estado}</Text>
                  </View>
                </View>
                
                <View style={styles.cursoDetalles}>
                  <Text style={styles.cursoDetalle}>
                    🕒 {curso.horario || 'Horario por confirmar'}
                  </Text>
                  <Text style={styles.cursoDetalle}>
                    📅 {new Date(curso.fechaInicio).toLocaleDateString()} - {new Date(curso.fechaFin).toLocaleDateString()}
                  </Text>
                  <Text style={styles.cursoDetalle}>
                    💳 Monto pagado: {formatMonto(curso.montoPagado)}
                  </Text>
                  
                  {/* ✅ Mostrar fecha de inscripción */}
                  {curso.fechaInscripcion && (
                    <Text style={[styles.cursoDetalle, { color: '#2B5399', fontWeight: '500' }]}>
                      📝 Inscripto el: {new Date(curso.fechaInscripcion).toLocaleDateString()}
                    </Text>
                  )}
                  
                  {/* ✅ Mostrar información de baja mejorada */}
                  {curso.estado === 'CANCELADO' && curso.fechaBaja && (
                    <View style={styles.bajaInfoContainer}>
                      <Text style={[styles.cursoDetalle, { color: '#dc3545', fontWeight: '500' }]}>
                        ❌ Dado de baja el: {new Date(curso.fechaBaja).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.cursoDetalle, { color: '#28a745', fontWeight: '500' }]}>
                        💰 Reintegro procesado - Ver historial de pagos
                      </Text>
                    </View>
                  )}
                  
                  {(curso.totalClases || 0) > 0 && (
                    <View style={styles.asistenciaContainer}>
                      <Text style={styles.asistenciaText}>
                        👥 Total de clases: {curso.totalClases || 0}
                      </Text>
                      {curso.estado === 'FINALIZADO' && (
                        <Text style={[
                          styles.aprobacionText,
                          { color: curso.aprobado ? '#28a745' : '#dc3545' }
                        ]}>
                          {curso.aprobado 
                            ? '✅ Curso aprobado'
                            : '❌ Curso no aprobado'
                          }
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes cursos inscriptos</Text>
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => router.push('/drawer/courses')}
              >
                <Text style={styles.exploreButtonText}>Explorar cursos disponibles</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          {historialData.movimientos.length > 0 ? (
            historialData.movimientos
              .sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime())
              .map((movimiento) => {
                const tipoInfo = getTipoMovimientoInfo(movimiento.tipoMovimiento);
                
                return (
                  <View key={`movimiento-${movimiento.id}`} style={styles.movimientoCard}>
                    <View style={styles.movimientoHeader}>
                      <View style={styles.movimientoIcon}>
                        <Ionicons name={tipoInfo.icon as any} size={24} color={tipoInfo.color} />
                      </View>
                      <View style={styles.movimientoInfo}>
                        <Text style={styles.movimientoTipo}>{tipoInfo.label}</Text>
                        <Text style={styles.movimientoFecha}>{formatFecha(movimiento.fechaMovimiento)}</Text>
                        {movimiento.nombreCurso && (
                          <Text style={styles.movimientoCurso}>📚 {movimiento.nombreCurso}</Text>
                        )}
                        {movimiento.nombreSede && (
                          <Text style={styles.movimientoSede}>📍 {movimiento.nombreSede}</Text>
                        )}
                      </View>
                      <View style={styles.movimientoMontos}>
                        {/* ✅ Mostrar montos con colores claros */}
                        <Text style={[styles.movimientoMonto, { color: tipoInfo.color }]}>
                          {tipoInfo.showAs === 'payment' ? (
                            `-${formatMonto(Math.abs(movimiento.monto))}`
                          ) : tipoInfo.showAs === 'credit' ? (
                            `+${formatMonto(Math.abs(movimiento.monto))}`
                          ) : (
                            `-${formatMonto(Math.abs(movimiento.monto))}`
                          )}
                        </Text>
                      </View>
                    </View>
                    
                    {movimiento.descripcion && (
                      <Text style={styles.movimientoDescripcion}>{movimiento.descripcion}</Text>
                    )}
                  </View>
                );
              })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No hay movimientos registrados</Text>
            </View>
          )}
        </View>
      )}
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
  headerContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2B5399',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  cursoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cursoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cursoInfo: {
    flex: 1,
  },
  cursoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 4,
  },
  cursoSede: {
    fontSize: 14,
    color: '#666',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cursoDetalles: {
    marginBottom: 12,
  },
  cursoDetalle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  asistenciaContainer: {
    marginTop: 8,
  },
  asistenciaText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  aprobacionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bajaInfoContainer: {
    backgroundColor: '#fff5f5',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
    marginTop: 8,
  },
  movimientoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  movimientoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movimientoIcon: {
    marginRight: 12,
  },
  movimientoInfo: {
    flex: 1,
  },
  movimientoTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  movimientoFecha: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  movimientoCurso: {
    fontSize: 12,
    color: '#2B5399',
    marginBottom: 1,
  },
  movimientoSede: {
    fontSize: 11,
    color: '#888',
  },
  movimientoMontos: {
    alignItems: 'flex-end',
  },
  movimientoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  movimientoDescripcion: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#2B5399',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});