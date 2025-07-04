import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/authContext';

export default function AttendanceScreen() {
  const { userId } = useAuth();
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsistencias = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://192.168.1.31:8080/api/asistencias?idAlumno=${userId}`);
        if (!res.ok) throw new Error('No se pudo cargar el historial');
        const data = await res.json();
        setAsistencias(data);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el historial');
        setAsistencias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAsistencias();
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" color="#2B5399" style={{ flex: 1, marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de asistencia</Text>
      <FlatList
        data={asistencias}
        keyExtractor={item => item.idAsistencia.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.courseName}>{item.curso?.nombre || 'Curso'}</Text>
            <Text style={styles.courseInfo}>Fecha: {item.fecha}</Text>
            <Text style={styles.courseInfo}>Asistió: {item.presente ? 'Sí' : 'No'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE5D8', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2B5399', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  courseName: { fontSize: 16, fontWeight: 'bold', color: '#2B5399' },
  courseInfo: { fontSize: 13, color: '#333' },
});