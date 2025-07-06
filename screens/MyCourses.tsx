import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/authContext';

export default function MyCoursesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMisCursos = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const alumnoRes = await fetch(`http://192.168.1.31:8080/api/alumnos/por-usuario/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!alumnoRes.ok) {
        setCursos([]);
        return;
      }
      
      const alumnoData = await alumnoRes.json();
      const idAlumno = alumnoData.idAlumno;
      
      const res = await fetch(`http://192.168.1.31:8080/api/cursos/inscriptos?idAlumno=${idAlumno}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) throw new Error('No se pudieron cargar tus cursos');
      const data = await res.json();
      setCursos(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'No se pudieron cargar tus cursos');
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMisCursos();
    }, [fetchMisCursos])
  );

  const navigateToMyCourseDetail = (item: any) => {
    const cursoId = item.cronogramaCurso?.curso?.idCurso;
    const asistenciaId = item.idAsistenciaCurso;
    
    if (cursoId) {
      router.push({ pathname: '/drawer/mycoursesdetail', params: { id: cursoId, idAsistencia: asistenciaId } });
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2B5399" style={{ flex: 1, marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis cursos inscriptos</Text>
      {cursos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes cursos inscriptos aún</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/drawer/(tabs)/courses')}
          >
            <Text style={styles.exploreButtonText}>Explorar cursos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cursos}
          keyExtractor={item => item.idAsistenciaCurso?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigateToMyCourseDetail(item)}>
              <View style={[
                styles.card,
                !item.fechaBaja ? styles.activeCard : styles.inactiveCard
              ]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.courseName}>
                    {item.cronogramaCurso?.curso?.nombre || 'Curso sin nombre'}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    !item.fechaBaja ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {!item.fechaBaja ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.courseDesc}>
                  {item.cronogramaCurso?.curso?.descripcion || 'Sin descripción'}
                </Text>
                
                <View style={styles.courseDetails}>
                  <Text style={styles.courseInfo}>
                    🏫 {item.cronogramaCurso?.sede?.nombreSede || 'Sin sede'}
                  </Text>
                  <Text style={styles.courseInfo}>
                    🕒 {item.cronogramaCurso?.horario || 'Sin horario'}
                  </Text>
                  {item.cronogramaCurso?.fechaInicio && (
                    <Text style={styles.courseInfo}>
                      📅 Inicio: {new Date(item.cronogramaCurso.fechaInicio).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                
                <Text style={styles.viewDetails}>👆 Toca para ver detalles</Text>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDE5D8', 
    padding: 16 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2B5399', 
    marginBottom: 16 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  inactiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2B5399',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseDesc: { 
    fontSize: 13, 
    color: '#333', 
    marginBottom: 8 
  },
  courseDetails: {
    marginBottom: 8,
  },
  courseInfo: { 
    fontSize: 12, 
    color: '#555', 
    marginBottom: 2 
  },
  viewDetails: {
    fontSize: 11,
    color: '#2B5399',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: '#2B5399',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});