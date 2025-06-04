import React from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';

const recetasFavoritas = [
  {
    id: '1',
    nombre: 'Ñoquis caseros',
    imagen: 'https://cdn0.recetasgratis.net/es/posts/6/0/4/noquis_de_papa_2406_600.webp',
    tiempo: '40 min',
  },
  {
    id: '2',
    nombre: 'Empanadas salteñas',
    imagen: 'https://img.recetascomidas.com/recetas/1000x1000/empanadas-saltenas-argentinas.jpg',
    tiempo: '1 h',
  },
];

export default function FavoriteRecipesScreen() {
  const router = useRouter();

  const renderReceta = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`./recipedetail/${item.id}`)} // suponiendo navegación por ID
      // HAY QUE VER SI EN LA API TENE ID A MEDDA QUE SE VAN CARGANDO RECETAS
    >
      <Image source={{ uri: item.imagen }} style={styles.imagen} />
      <View style={styles.info}>
        <Text style={styles.titulo}>{item.nombre}</Text>
        <Text style={styles.texto}>⏱️ {item.tiempo}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.encabezado}>Mis Recetas Favoritas</Text>
      <FlatList
        data={recetasFavoritas}
        renderItem={renderReceta}
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
