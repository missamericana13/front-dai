import React from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';

const cursosInscripto = [
  {
    id: '1',
    titulo: 'Milanesas 101',
    imagen: 'https://negociosdeargentina.com.ar/wp-content/uploads/2024/04/Milanesa.webp',
    clases: 10,
    modalidad: 'Presencial',
    proximaClase: 'Mié 5/6 - 18:00',
  },
  {
    id: '2',
    titulo: 'Postres Argentinos',
    imagen: 'https://imagenes.elpais.com/resizer/fakeurl.jpg', // usá una real si querés
    clases: 8,
    modalidad: 'Online',
    proximaClase: 'Vie 7/6 - 20:00',
  }
];

export default function MyCoursesScreen() {
  const router = useRouter();

  const renderCurso = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`./coursesdetail`)} // suponiendo que tenés navegación por id
    >
      <Image source={{ uri: item.imagen }} style={styles.imagen} />
      <View style={styles.info}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.texto}>{item.modalidad} • {item.clases} clases</Text>
        <Text style={styles.texto}>📅 Próxima clase: {item.proximaClase}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.encabezado}>Mis Cursos</Text>
      <FlatList
        data={cursosInscripto}
        renderItem={renderCurso}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE5D8', padding: 12 },
  encabezado: {
    fontSize: 22, fontWeight: 'bold',
    color: '#2B5399', marginBottom: 12
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2
  },
  imagen: { width: 100, height: 100 },
  info: { flex: 1, padding: 10, justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#2B5399' },
  texto: { fontSize: 13, marginTop: 4 }
});
