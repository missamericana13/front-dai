import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface TipoReceta {
  idTipo: number;
  descripcion: string;
}

export default function AddRecipeScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState([{ cantidad: '', nombre: '' }]);
  const [steps, setSteps] = useState([{ texto: '' }]);
  const [servings, setServings] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedTipoReceta, setSelectedTipoReceta] = useState<number | null>(null);
  const [tiposReceta, setTiposReceta] = useState<TipoReceta[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setImage(null);
    setImageBase64(null);
    setIngredients([{ cantidad: '', nombre: '' }]);
    setSteps([{ texto: '' }]);
    setServings('');
    setPreparationTime('');
    setDifficulty('');
    setSelectedTipoReceta(null);
  };

  useEffect(() => {
    const fetchTiposReceta = async () => {
      setLoadingTipos(true);
      try {
        const response = await fetch('http://192.168.1.31:8080/api/tiposReceta');
        if (response.ok) {
          const tipos = await response.json();
          setTiposReceta(tipos);
        } else {
          console.error('Error cargando tipos de receta');
        }
      } catch (error) {
        console.error('Error cargando tipos de receta:', error);
      } finally {
        setLoadingTipos(false);
      }
    };
    
    fetchTiposReceta();
    resetForm();
  }, []);

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre de la receta.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { cantidad: '', nombre: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const updated = [...ingredients];
      updated.splice(index, 1);
      setIngredients(updated);
    }
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

  const handleAddStep = () => {
    setSteps([...steps, { texto: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const updated = [...steps];
      updated.splice(index, 1);
      setSteps(updated);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].texto = value;
    setSteps(updated);
  };

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

  const handleSave = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
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

      const receta = {
        nombreReceta: name,
        descripcionReceta: description,
        fotoPrincipal: imageBase64,
        porciones: servings ? parseInt(servings) : 1,
        cantidadPersonas: servings ? parseInt(servings) : 1,
        tiempoPreparacion: preparationTime ? parseInt(preparationTime) : null,
        dificultad: difficulty || null,
        tipoReceta: selectedTipoReceta ? { idTipo: selectedTipoReceta } : null,
        ingredientes: ingredients.map(item => ({
          cantidad: item.cantidad,
          nombre: item.nombre
        }))
      };

      console.log('Enviando receta:', receta);

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
      console.error('Error saving recipe:', err);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    }
  };

  const difficultyOptions = [
    { label: 'Fácil', value: 'facil', color: '#27ae60' },
    { label: 'Intermedio', value: 'intermedio', color: '#f39c12' },
    { label: 'Difícil', value: 'dificil', color: '#e74c3c' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header con progreso */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => step === 1 ? router.back() : handleBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2B5399" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Información básica' : 'Detalles de la receta'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* ✅ Barra de progreso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
          <Text style={styles.progressText}>Paso {step} de 2</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* ✅ Paso 1: Información básica */}
              <View style={styles.welcomeSection}>
                <Ionicons name="restaurant" size={48} color="#2B5399" />
                <Text style={styles.welcomeTitle}>¡Compartí tu receta!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Contanos el nombre de tu deliciosa creación
                </Text>
              </View>

              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la receta *</Text>
                  <TextInput
                    placeholder="Ej: Tarta de manzana casera"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                  <Text style={styles.primaryButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              {/* ✅ Imagen de la receta */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="camera" size={20} color="#2B5399" /> Foto principal
                </Text>
                <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.recipeImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={32} color="#999" />
                      <Text style={styles.imagePlaceholderText}>Tocar para agregar foto</Text>
                      <Text style={styles.imagePlaceholderSubtext}>Opcional</Text>
                    </View>
                  )}
                  {image && (
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={20} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* ✅ Descripción */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción *</Text>
                  <TextInput
                    placeholder="Contanos de qué se trata tu receta..."
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#999"
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* ✅ NUEVO: Tipo de receta */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="pricetag" size={20} color="#2B5399" /> Tipo de receta
                </Text>
                
                {loadingTipos ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando tipos...</Text>
                  </View>
                ) : (
                  <View style={styles.tipoContainer}>
                    {tiposReceta.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.idTipo}
                        style={[
                          styles.tipoOption,
                          selectedTipoReceta === tipo.idTipo && styles.tipoSelected
                        ]}
                        onPress={() => setSelectedTipoReceta(
                          selectedTipoReceta === tipo.idTipo ? null : tipo.idTipo
                        )}
                      >
                        <Text style={[
                          styles.tipoText,
                          selectedTipoReceta === tipo.idTipo && styles.tipoTextSelected
                        ]}>
                          {tipo.descripcion}
                        </Text>
                        {selectedTipoReceta === tipo.idTipo && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={styles.optionalText}>Opcional - Ayuda a otros a encontrar tu receta</Text>
              </View>

              {/* ✅ Información adicional */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="information-circle" size={20} color="#2B5399" /> Información adicional
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Porciones</Text>
                  <TextInput
                    placeholder="4"
                    value={servings}
                    onChangeText={setServings}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* ✅ Ingredientes */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="list" size={20} color="#2B5399" /> Ingredientes *
                </Text>
                
                {ingredients.map((item, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <View style={styles.ingredientNumber}>
                      <Text style={styles.ingredientNumberText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      placeholder="Cantidad"
                      value={item.cantidad}
                      onChangeText={(text) => handleIngredientChange(index, 'cantidad', text)}
                      style={[styles.input, styles.quantityInput]}
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      placeholder="Ingrediente"
                      value={item.nombre}
                      onChangeText={(text) => handleIngredientChange(index, 'nombre', text)}
                      style={[styles.input, styles.ingredientInput]}
                      placeholderTextColor="#999"
                    />
                    {ingredients.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => handleRemoveIngredient(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>
                  <Ionicons name="add-circle-outline" size={20} color="#2B5399" />
                  <Text style={styles.addButtonText}>Agregar ingrediente</Text>
                </TouchableOpacity>
              </View>

              {/* ✅ Pasos */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="list-circle" size={20} color="#2B5399" /> Preparación *
                </Text>
                
                {steps.map((item, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      placeholder={`Describí el paso ${index + 1}...`}
                      value={item.texto}
                      onChangeText={(text) => handleStepChange(index, text)}
                      style={[styles.input, styles.stepInput]}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#999"
                      textAlignVertical="top"
                    />
                    {steps.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => handleRemoveStep(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                <TouchableOpacity style={styles.addButton} onPress={handleAddStep}>
                  <Ionicons name="add-circle-outline" size={20} color="#2B5399" />
                  <Text style={styles.addButtonText}>Agregar paso</Text>
                </TouchableOpacity>
              </View>

              {/* ✅ Botón guardar */}
              <View style={styles.formSection}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text style={styles.saveButtonText}>Guardar receta</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2B5399',
    borderRadius: 2,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B5399',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B5399',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B5399',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2B5399',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#2B5399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
  },
  imagePlaceholder: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(43, 83, 153, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tipoOption: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipoSelected: {
    backgroundColor: '#2B5399',
    borderColor: '#2B5399',
  },
  tipoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tipoTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  optionalText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  difficultyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ingredientNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B5399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityInput: {
    flex: 1,
  },
  ingredientInput: {
    flex: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B5399',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepInput: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2B5399',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#2B5399',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});