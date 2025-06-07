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
  View
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../context/authContext';

const API_BASE_URL = 'http://192.168.1.31:8080/api/recetas';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [receta, setReceta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cantidadPersonas, setCantidadPersonas] = useState(1);
  const [pasos, setPasos] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [comentarioNuevo, setComentarioNuevo] = useState('');
  const [estrellasNueva, setEstrellasNueva] = useState(5);

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
            : 'https://via.placeholder.com/400x160?text=Sin+Imagen'
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

  // Calcular promedio de estrellas real
  const promedioEstrellas =
    calificaciones.length === 0
      ? 0
      : calificaciones.reduce((total, c) => total + (c.calificacion || 0), 0) / calificaciones.length;

  const renderEstrellas = (cantidad: number) => {
    return (
      <Text>
        {'★'.repeat(Math.round(cantidad))}
        {'☆'.repeat(5 - Math.round(cantidad))}
      </Text>
    );
  };

  const renderIngrediente = ({ item }: { item: any }) => {
    const unidad = item.unidad?.descripcion || item.unidad || '';
    const proporcion = cantidadPersonas / (receta.cantidadPersonas || receta.porciones || 1);
    const cantidadAjustada = unidad.toLowerCase().includes('necesaria')
      ? unidad
      : `${(item.cantidad * proporcion).toFixed(1)} ${unidad}`;

    return (
      <Text style={styles.texto}>
        {unidad.toLowerCase().includes('necesaria')
          ? `${unidad} de ${item.nombre}`
          : `${cantidadAjustada} de ${item.nombre}`}
      </Text>
    );
  };

  // Render de estrellas para seleccionar
  const renderEstrellasInput = () => (
    <View style={{ flexDirection: 'row', marginLeft: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => setEstrellasNueva(n)}>
          <Text style={{
            fontSize: 28,
            color: n <= estrellasNueva ? '#FFD700' : '#ccc',
            marginHorizontal: 2
          }}>
            ★
          </Text>
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
      // Ajusta esto según tu modelo de usuario
      const idUsuario = user?.idUsuario || user?.id || user?.usuario?.idUsuario;
      if (!idUsuario) {
        Alert.alert('Error', 'No se encontró el usuario');
        return;
      }
      const body = {
        calificacion: estrellasNueva,
        comentarios: comentarioNuevo.trim(),
        usuario: { idUsuario: idUsuario },
        receta: { idReceta: id }
      };
      const res = await fetch('http://192.168.1.31:8080/api/calificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (loading || !receta) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE5D8' }}>
        <Text>Cargando receta...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Image source={{ uri: receta.fotoPrincipal }} style={styles.imagen} />
          <Text style={styles.titulo}>{receta.nombreReceta}</Text>

          <Text style={styles.subtitulo}>Descripción</Text>
          <Text style={styles.texto}>{receta.descripcionReceta || 'Sin descripción'}</Text>

          <Text style={styles.subtitulo}>Ingredientes (para {cantidadPersonas} personas)</Text>
          {(receta.ingredientes || []).map((item: any, index: number) => (
            <View key={index}>{renderIngrediente({ item })}</View>
          ))}

          <Text style={styles.subtitulo}>Pasos</Text>
          {pasos.length > 0 ? (
            pasos.map((paso, idx) => (
              <Text key={idx} style={styles.texto}>{`${paso.nroPaso}. ${paso.texto}`}</Text>
            ))
          ) : (
            <Text style={styles.texto}>No hay pasos cargados.</Text>
          )}

          {/* Control de cantidad de personas con + y - */}
          <View style={styles.controlPersonas}>
            <Text style={styles.texto}>Cantidad de personas</Text>
            <TouchableOpacity
              style={styles.masMenos}
              onPress={() => setCantidadPersonas(prev => Math.max(1, prev - 1))}
            >
              <Text style={styles.masMenosTexto}>-</Text>
            </TouchableOpacity>
            <Text style={styles.cantidadTexto}>{cantidadPersonas}</Text>
            <TouchableOpacity
              style={styles.masMenos}
              onPress={() => setCantidadPersonas(prev => Math.min(10, prev + 1))}
            >
              <Text style={styles.masMenosTexto}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>Calificación</Text>
          {calificaciones.length > 0 ? (
            <Text style={styles.texto}>
              {renderEstrellas(promedioEstrellas)} ({promedioEstrellas.toFixed(1)}/5)
            </Text>
          ) : (
            <Text style={styles.texto}>Esta receta aún no tiene calificaciones.</Text>
          )}

          <Text style={styles.subtitulo}>Comentarios</Text>
          {calificaciones.length > 0 ? (
            calificaciones.map((comentario, index) => (
              <View
                key={`${comentario.usuario?.nombre || 'anon'}-${comentario.comentarios}-${index}`}
                style={styles.comentario}
              >
                <Image
                  source={{ uri: 'https://ui-avatars.com/api/?name=' + (comentario.usuario?.nombre || 'User') }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.texto}>
                    {comentario.usuario?.nombre || 'Anónimo'} {renderEstrellas(comentario.calificacion || 0)}
                  </Text>
                  <Text style={styles.texto}>{comentario.comentarios}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.texto}>No hay comentarios aún.</Text>
          )}

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
              <View style={[styles.controlPersonas, { alignItems: 'center' }]}>
                <Text style={styles.texto}>Estrellas</Text>
                {renderEstrellasInput()}
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
  masMenos: {
    backgroundColor: '#2B5399',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 6,
  },
  masMenosTexto: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cantidadTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
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