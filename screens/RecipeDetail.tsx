// RecipeDetailScreen.tsx
import React, { useContext, useState } from 'react';
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
  View
} from 'react-native';
import { AuthContext } from '../context/authContext';

const recetaBase = {
  titulo: 'Milanesa a la napolitana',
  descripcion: 'Una receta clásica argentina, ideal para compartir.',
  imagen: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Milanesa_Napolitana_-_Delivery.jpg',
  personasOriginal: 2,
  ingredientes: [
    { nombre: 'Carne', cantidad: 1, unidad: 'Kg' },
    { nombre: 'Queso', cantidad: 500, unidad: 'gr' },
    { nombre: 'Salsa de tomate', cantidad: 1, unidad: 'Cantidad necesaria' },
  ],
  pasos: 'Agarrar el teléfono y pedir delivery',
  comentarios: [
    {
      usuario: 'michi123',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      texto: 'Fácil y rápida de hacer',
      estrellas: 5,
    }
  ]
};

export default function RecipeDetailScreen() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [cantidadPersonas, setCantidadPersonas] = useState(recetaBase.personasOriginal);
  const [comentarios, setComentarios] = useState(recetaBase.comentarios);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [estrellasNueva, setEstrellasNueva] = useState('5');

  const promedioEstrellas = comentarios.length === 0
    ? 0
    : comentarios.reduce((total, c) => total + c.estrellas, 0) / comentarios.length;

  const renderEstrellas = (promedio: number) => {
    const enteras = Math.floor(promedio);
    const media = promedio % 1 >= 0.5;
    return '★'.repeat(enteras) + (media ? '½' : '');
  };

  const renderIngrediente = ({ item }: { item: any }) => {
    const proporcion = cantidadPersonas / recetaBase.personasOriginal;
    const cantidadAjustada = item.unidad.includes('necesaria')
      ? item.unidad
      : `${(item.cantidad * proporcion).toFixed(1)} ${item.unidad}`;

    return (
      <Text style={styles.texto}>
        {item.unidad.includes('necesaria')
          ? `${item.unidad} de ${item.nombre}`
          : `${cantidadAjustada} de ${item.nombre}`}
      </Text>
    );
  };

  const enviarComentario = () => {
    if (!comentarioNuevo.trim()) {
      Alert.alert('Error', 'El comentario no puede estar vacío');
      return;
    }

    const nombreUsuario =
      user?.nombre && user?.apellido
        ? `${user.nombre} ${user.apellido}`
        : user?.displayName || user?.email || 'Anónimo';

    const nuevo = {
      usuario: nombreUsuario,
      avatar: user?.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
      texto: comentarioNuevo.trim(),
      estrellas: Math.max(1, Math.min(5, parseInt(estrellasNueva) || 5))
    };

    setComentarios([nuevo, ...comentarios]);
    setComentarioNuevo('');
    setEstrellasNueva('5');
    Alert.alert('Gracias', 'Tu comentario fue agregado');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Image source={{ uri: recetaBase.imagen }} style={styles.imagen} />
          <Text style={styles.titulo}>{recetaBase.titulo}</Text>

          <Text style={styles.subtitulo}>Descripción</Text>
          <Text style={styles.texto}>{recetaBase.descripcion}</Text>

          <Text style={styles.subtitulo}>Ingredientes (para {cantidadPersonas} personas)</Text>
          {recetaBase.ingredientes.map((item, index) => (
            <View key={index}>{renderIngrediente({ item })}</View>
          ))}

          <Text style={styles.subtitulo}>Pasos</Text>
          <Text style={styles.texto}>{recetaBase.pasos}</Text>

          <View style={styles.controlPersonas}>
            <Text style={styles.texto}>Cantidad de personas</Text>
            <TextInput
              style={styles.input}
              value={cantidadPersonas.toString()}
              keyboardType="numeric"
              onChangeText={(text) => {
                const valor = parseInt(text) || recetaBase.personasOriginal;
                setCantidadPersonas(valor);
              }}
            />
          </View>

          <Text style={styles.subtitulo}>Calificación</Text>
          <Text style={styles.texto}>
            {renderEstrellas(promedioEstrellas)} ({promedioEstrellas.toFixed(1)}/5)
          </Text>

          <Text style={styles.subtitulo}>Comentarios</Text>
          {comentarios.map((comentario, index) => (
            <View
              key={`${comentario.usuario}-${comentario.texto}-${index}`}
              style={styles.comentario}
            >
              <Image source={{ uri: comentario.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.texto}>
                  {comentario.usuario} {'★'.repeat(comentario.estrellas)}
                </Text>
                <Text style={styles.texto}>{comentario.texto}</Text>
              </View>
            </View>
          ))}

          {user && (
            <View style={styles.nuevoComentario}>
              <Text style={styles.subtitulo}>Agregar comentario</Text>
              <TextInput
                placeholder="Escribí tu comentario"
                style={styles.inputGrande}
                value={comentarioNuevo}
                onChangeText={setComentarioNuevo}
                multiline
              />
              <View style={styles.controlPersonas}>
                <Text style={styles.texto}>Estrellas</Text>
                <TextInput
                  style={styles.input}
                  value={estrellasNueva}
                  onChangeText={setEstrellasNueva}
                  keyboardType="numeric"
                  maxLength={1}
                />
              </View>
              <TouchableOpacity style={styles.boton} onPress={enviarComentario}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Enviar</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#EDE5D8', padding: 12 },
  imagen: { width: '100%', height: 200, borderRadius: 8 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#2B5399', marginTop: 10 },
  subtitulo: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  texto: { fontSize: 14, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 6, borderRadius: 8,
    width: 60, textAlign: 'center', backgroundColor: 'white', marginLeft: 8
  },
  inputGrande: {
    borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8,
    backgroundColor: 'white', textAlignVertical: 'top', height: 80, marginTop: 8
  },
  controlPersonas: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, marginBottom: 8
  },
  comentario: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', padding: 8, borderRadius: 8,
    marginTop: 8
  },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  nuevoComentario: { marginTop: 16 },
  boton: {
    marginTop: 10, backgroundColor: '#2B5399',
    padding: 10, borderRadius: 8, alignItems: 'center'
  }
});
