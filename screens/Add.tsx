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
import { useRecipes } from '../context/recipeContext';

export default function AddRecipeScreen() {
  const router = useRouter();
  const { recipes, addRecipe, removeRecipe } = useRecipes();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState([{ cantidad: '', nombre: '' }]);
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setImage(null);
    setIngredients([{ cantidad: '', nombre: '' }]);
    setInstructions('');
    setServings('');
    setTags('');
  };

  useEffect(() => {
    resetForm(); // limpia todo al entrar
  }, []);

  const handleNext = () => {
    const trimmedName = name.trim().toLowerCase();
    const existingRecipe = recipes.find((r) => r.name.trim().toLowerCase() === trimmedName);

    if (existingRecipe) {
      Alert.alert(
        'Receta existente',
        'Ya subiste esta receta antes. ¿Querés editarla o reemplazarla?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Editar',
            onPress: () => {
              router.push({
                pathname: '/drawer/recipedetail',
                params: { name: existingRecipe.name },
              });
            },
          },
          {
            text: 'Reemplazar',
            onPress: () => {
              removeRecipe(existingRecipe.name);
              setStep(2);
            },
          },
        ]
      );
    } else {
      setStep(2);
    }
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

  const handleSave = () => {
    const formattedIngredients = ingredients.map(
      (item) => `${item.cantidad} ${item.nombre}`.trim()
    );
    const nuevaReceta = {
      name,
      image,
      ingredients: formattedIngredients,
      instructions,
      servings,
      tags,
    };
    addRecipe(nuevaReceta);
    Alert.alert('¡Receta guardada con éxito!', '', [
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
              onPress={() =>
                Alert.alert('Aún no implementado', 'Esto se conectará con la API')
              }
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
            <TextInput
              placeholder="Escribí los pasos a seguir..."
              value={instructions}
              onChangeText={setInstructions}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.subtitle}>¿Para cuántas personas?</Text>
            <TextInput
              placeholder="Ej: 4"
              value={servings}
              onChangeText={setServings}
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.subtitle}>Tags</Text>
            <TextInput
              placeholder="Ej: fácil, económico, horno"
              value={tags}
              onChangeText={setTags}
              style={styles.input}
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
  textArea: {
    height: 120,
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
