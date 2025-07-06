import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function VerifyIdentity() {
  const router = useRouter();

  const [frontImage, setFrontImage] = useState('');
  const [backImage, setBackImage] = useState('');
  const [dniNumber, setDniNumber] = useState('');

  const handleSave = () => {
    router.push('/drawer');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Verificación de Identidad</Text>

        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => setFrontImage('imagen_frontal.jpg')}
        >
          <Text style={styles.buttonText}>
            {frontImage ? 'Imagen frontal cargada' : 'Subir imagen frontal del DNI'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => setBackImage('imagen_dorso.jpg')}
        >
          <Text style={styles.buttonText}>
            {backImage ? 'Imagen dorso cargada' : 'Subir imagen del dorso del DNI'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Número de trámite"
          keyboardType="numeric"
          value={dniNumber}
          onChangeText={setDniNumber}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('./PaymentRequired')}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cc}>Saberes y Sabores</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#2B5399',
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#ffffff',
  },
  input: {
    width: '100%',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  imageButton: {
    width: '100%',
    backgroundColor: '#EDE5D8',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#EDE5D8',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop: 15,
  },
  buttonText: {
    color: '#413E3E',
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    color: '#ffffff',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  cc: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 25,
    fontFamily: 'aesthetic moments',
    fontStyle: 'italic',
  },
});
