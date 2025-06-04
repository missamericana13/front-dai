import React from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, Button
} from 'react-native';

const curso = {
  titulo: 'Milanesas 101',
  descripcion: 'Aprendé a hacer la milanesa perfecta, desde la carne hasta el empanizado.',
  objetivo: 'Que el alumno domine la técnica tradicional y moderna de la milanesa argentina.',
  imagen: 'https://negociosdeargentina.com.ar/wp-content/uploads/2024/04/Milanesa.webp',
  clases: 10,
  modalidad: 'Presencial',
  precio: '$12.000',
  temario: [
    'Clase 1: Historia y tipos de milanesas',
    'Clase 2: Cortes de carne ideales',
    'Clase 3: Empanizados especiales',
    'Clase 4: Fritura perfecta',
    'Clase 5: Guarniciones clásicas',
    'Clase 6: Variantes vegetarianas',
    'Clase 7: Milanesa napolitana',
    'Clase 8: Presentación y emplatado',
    'Clase 9: Revisión y práctica',
    'Clase 10: Examen final',
  ],
  sedes: [
    {
      nombre: 'Sede Palermo',
      direccion: 'Av. Santa Fe 1234',
      horario: 'Lunes y miércoles - 18:00 a 20:00',
    },
    {
      nombre: 'Sede Belgrano',
      direccion: 'Cabildo 2222',
      horario: 'Martes y jueves - 17:00 a 19:00',
    }
  ],
  materiales: [
    'Delantal de cocina',
    'Cuchillo filoso',
    'Tabla de picar',
    'Recipiente para empanar',
  ]
};

export default function CourseDetailScreen() {
  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: curso.imagen }} style={styles.imagen} />
      <Text style={styles.titulo}>{curso.titulo}</Text>
      <Text style={styles.subtitulo}>{curso.modalidad} • {curso.clases} clases • {curso.precio}</Text>

      <Text style={styles.seccion}>Objetivo</Text>
      <Text style={styles.texto}>{curso.objetivo}</Text>

      <Text style={styles.seccion}>Descripción</Text>
      <Text style={styles.texto}>{curso.descripcion}</Text>

      <Text style={styles.seccion}>Temario</Text>
      {curso.temario.map((clase, idx) => (
        <Text key={idx} style={styles.texto}>📘 {clase}</Text>
      ))}

      <Text style={styles.seccion}>Sedes disponibles</Text>
      {curso.sedes.map((sede, idx) => (
        <View key={idx} style={styles.sede}>
          <Text style={styles.texto}>🏫 {sede.nombre}</Text>
          <Text style={styles.texto}>📍 {sede.direccion}</Text>
          <Text style={styles.texto}>🕒 {sede.horario}</Text>
        </View>
      ))}

      <Text style={styles.seccion}>Materiales necesarios</Text>
      {curso.materiales.map((item, idx) => (
        <Text key={idx} style={styles.texto}>🧾 {item}</Text>
      ))}

      <View style={styles.botonInscribirme}>
        <Button title="Inscribirme" color="#2B5399" onPress={() => alert('Inscripción exitosa')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE5D8', padding: 12 },
  imagen: { width: '100%', height: 200, borderRadius: 8 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#2B5399', marginTop: 10 },
  subtitulo: { fontSize: 16, fontWeight: '600', marginTop: 4, color: '#555' },
  seccion: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 6 },
  texto: { fontSize: 14, marginBottom: 4 },
  sede: { marginBottom: 12 },
  botonInscribirme: { marginTop: 24, marginBottom: 32 }
});
