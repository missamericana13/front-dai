import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddRecipeScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState([{ cantidad: '', nombre: '' }]);
  const [steps, setSteps] = useState([{ texto: '' }]);
  const [servings, setServings] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setImage(null);
    setImageBase64(null);
    setIngredients([{ cantidad: '', nombre: '' }]);
    setSteps([{ texto: '' }]);
    setServings('');
  };

  useEffect(() => {
    resetForm();
  }, []);

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre de la receta.');
      return;
    }
    setStep(2);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { cantidad: '', nombre: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  const handleIngredientChange = (
    index: number,
    field: 'cantidad' | 'nombre',
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  // PASOS
  const handleAddStep = () => {
    setSteps([...steps, { texto: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = [...steps];
    updated.splice(index, 1);
    setSteps(updated);
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].texto = value;
    setSteps(updated);
  };

  // Seleccionar imagen y convertir a base64
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage(result.assets[0].uri || null);
      setImageBase64(result.assets[0].base64);
    }
  };

  // Guardar receta y luego los pasos en el backend
  const handleSave = async () => {
    if (
      !name.trim() ||
      ingredients.some(i => !i.nombre.trim()) ||
      steps.some(s => !s.texto.trim())
    ) {
      Alert.alert('Error', 'Completá todos los campos obligatorios.');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const token = await AsyncStorage.getItem('token');

      if (!userId || !token) {
        Alert.alert('Error', 'No se encontró el usuario o el token.');
        return;
      }

      // Estructura correcta para el backend
      const receta = {
        nombreReceta: name,
        fotoPrincipal: imageBase64, // base64 o null
        porciones: servings ? parseInt(servings) : 1,
        ingredientes: ingredients.map(item => ({
          cantidad: item.cantidad,
          nombre: item.nombre
        }))
        // Si tu modelo requiere descripcionReceta, cantidadPersonas, tipoReceta, agrégalos aquí
      };

      // 1. Crear la receta
      const res = await fetch(`http://192.168.1.31:8080/api/recetas?idUsuario=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(receta)
      });

      if (!res.ok) {
        const msg = await res.text();
        Alert.alert('Error', msg);
        return;
      }

      // 2. Obtener el id de la receta creada (puedes devolverlo en el backend o buscar por nombre)
      const recetasRes = await fetch(`http://192.168.1.31:8080/api/recetas/usuario/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recetasUsuario = await recetasRes.json();
      const recetaCreada = recetasUsuario.find(r => r.nombreReceta === name);
      if (!recetaCreada) {
        Alert.alert('Error', 'No se pudo obtener la receta recién creada.');
        return;
      }
      const idReceta = recetaCreada.idReceta;

      // 3. Crear los pasos asociados a la receta
      for (let i = 0; i < steps.length; i++) {
        const paso = {
          receta: { idReceta },
          nroPaso: i + 1,
          texto: steps[i].texto
        };
        await fetch('http://192.168.1.31:8080/api/pasos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(paso)
        });
      }

      // Mostrar cartel y redirigir
      Alert.alert('¡Receta guardada!', 'Tu receta fue guardada correctamente.', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            setTimeout(() => {
              router.push('./myrecipes');
            }, 100);
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cargar Receta</Text>

        {step === 1 && (
          <>
            <TextInput
              placeholder="Nombre de la receta"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Button title="Siguiente" onPress={handleNext} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.subtitle}>Imagen</Text>
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <Text style={{ color: '#999' }}>Tocar para subir imagen</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.subtitle}>Ingredientes</Text>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  placeholder="Cantidad"
                  value={item.cantidad}
                  onChangeText={(text) => handleIngredientChange(index, 'cantidad', text)}
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                />
                <TextInput
                  placeholder="Ingrediente"
                  value={item.nombre}
                  onChangeText={(text) => handleIngredientChange(index, 'nombre', text)}
                  style={[styles.input, { flex: 2, marginRight: 5 }]}
                />
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddIngredient}>
              <Text style={styles.addButton}>+ Agregar ingrediente</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Pasos</Text>
            {steps.map((item, index) => (
              <View key={index} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <TextInput
                  placeholder={`Paso ${index + 1}`}
                  value={item.texto}
                  onChangeText={(text) => handleStepChange(index, text)}
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  multiline
                />
                <TouchableOpacity onPress={() => handleRemoveStep(index)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddStep}>
              <Text style={styles.addButton}>+ Agregar paso</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>¿Para cuántas personas?</Text>
            <TextInput
              placeholder="Ej: 4"
              value={servings}
              onChangeText={setServings}
              style={styles.input}
              keyboardType="numeric"
            />

            <Button title="Guardar receta" onPress={handleSave} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EDE5D8',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#2B5399',
    marginTop: 20,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    height: 160,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2B5399',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
    lineHeight: 28,
  },
  remove: {
    marginLeft: 8,
    color: 'red',
    fontSize: 18,
  },
  addButton: {
    color: '#2B5399',
    fontWeight: 'bold',
    marginBottom: 12,
  },
});